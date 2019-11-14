import { Alignment, AnchorButton, Blockquote, Button, ButtonGroup, Callout, Card, Code, Collapse, Divider, H3, HTMLSelect, InputGroup, Intent, Label, Navbar, Pre, Spinner, Switch, Tab, Tabs, Tag, UL, Tree, ITreeNode, Icon } from "@blueprintjs/core";
import React = require("react");

import "@blueprintjs/core/lib/css/blueprint.css";
import "normalize.css";

import { DARK } from "@blueprintjs/core/lib/esm/common/classes";

import { API } from "./api/Api";
import { Async } from "./utils/Async";

import { AppContext, AppState } from "./AppContext";

type BuildTask = typeof import("../../ci/BuildTask").BuildTask["prototype"];

export class App extends React.Component<{}, { darkMode: boolean }>
{
	private appState = new AppState(() => this.forceUpdate());

	public state = {
		darkMode: false
	};
	public render()
	{
		return <AppContext.Provider value={this.appState}>
			<div className={this.state.darkMode ? DARK : ""}>
				<Navbar style={{ position: "sticky", top: 0 }}>
					<Navbar.Group align={Alignment.LEFT}>
						<Navbar.Heading>RoCI</Navbar.Heading>
						<Navbar.Divider />
						<AnchorButton className="bp3-minimal" icon="home" text="Home" href="/" />
						<Navbar.Group>
							<RunTaskWidget />
						</Navbar.Group>
					</Navbar.Group>
					<Navbar.Group align={Alignment.RIGHT}>
						<Switch checked={this.state.darkMode} innerLabelChecked="Dark" innerLabel="Light" onChange={() => this.setState((state) => ({ darkMode: !state.darkMode }))} large={true} style={{ margin: "auto" }} />
					</Navbar.Group>
				</Navbar>
				<div style={{ display: "flex" }}>
					<Callout>
						<ProjectTree />
					</Callout>
					<Divider/>
					<Callout>
						<AppContext.Consumer>
							{(state) => <TaskListView tasks={state.filteredTasks} />}
						</AppContext.Consumer>
					</Callout>
				</div>
			</div>
		</AppContext.Provider>;
	}
}

function RunTaskWidget()
{
	let appContext = React.useContext(AppContext);
	let projects = appContext.projects;
	let [projectName, setProjectName] = React.useState(projects[0]?.name);

	if (!projectName && projects.length > 0)
	{
		setProjectName(projects[0]?.name);
	}

	let project = projects.find((p) => p.name === projectName);

	return <form style={{ display: "inline-flex" }} onSubmit={async (e) =>
	{
		e.preventDefault();
		let data = new FormData(e.currentTarget);
		await API.get("build", { project: data.get("project").toString(), revision: data.get("revision").toString() });
		appContext.updateTasks();
	}}>
		<HTMLSelect name="project" onChange={(e) => setProjectName(e.target.value)} defaultValue={projectName}>
			{projects?.map((p) => <option value={p.name}>{p.name}</option>)}
		</HTMLSelect>
		<HTMLSelect name="revision" defaultValue="default">
			{project?.branches.map((branch) => <option value={branch.name}>{branch.name}</option>)}
		</HTMLSelect>

		<Button text="Run" type="submit" />
	</form>;
}

export function TaskView(props: { task: BuildTask })
{
	let statusIntents = {
		pending: Intent.NONE,
		running: Intent.PRIMARY,
		completed: Intent.SUCCESS,
		failed: Intent.DANGER
	};

	let infoStyle: React.CSSProperties = {
		width: "100%",
		borderRadius: "10px",
		border: "1px solid rgba(0,0,0,0.1)",
		background: "rgba(0,0,0,0.1)",
		height: "300px",
		overflowY: "auto",
		padding: "10px"
	};

	let appContext = React.useContext(AppContext);

	let logs = <iframe src={props.task.logPath} style={infoStyle} />;

	let commits = <div style={infoStyle}>
		{
			props.task.commits && props.task.commits.map((commit) =>
				<Blockquote>
					<Tag>{commit.branch}</Tag> <Tag minimal={true}>{commit.author}</Tag> {commit.issues.map((issue) => <Tag intent={Intent.SUCCESS} interactive={true} onClick={() => showIssue(issue)}>{issue}</Tag>)}
					<br />
					<Code>{commit.message}</Code>
				</Blockquote>
			)}
	</div>;
	let times = props.task.timings;
	return <Card style={{ margin: "10px" }} elevation={3}>
		<H3>{`#${props.task.id} ${props.task.project}/${props.task.revision}`} <Tag large={true} intent={statusIntents[props.task.status]} style={{ float: "right" }}>{props.task.status}</Tag></H3>
		<p>
			{
				times.end && <><b>Completed:</b> {new Date(times.end).toLocaleString()} {(new Date(times.end).getTime() - new Date(times.start).getTime()) / 1000}s</>
				|| times.start && <><b>Start:</b> {new Date(times.create).toLocaleString()}</>
				|| <><b>Created:</b> {new Date(times.create).toLocaleString()}</>
			}
		</p>

		<Tabs renderActiveTabPanelOnly={true}>
			<Tab id="changes" title="Changes" panel={commits} />
			<Tab id="build_log" title="Build Log" panel={logs} />
			<Tabs.Expander />
		</Tabs>

		<Divider />

		{props.task.status === "running" && <Button intent={Intent.DANGER} onClick={() => API.get("taskkill", { id: props.task.id }).then(appContext.updateTasks)}>Stop</Button>}
		{props.task.status === "completed" &&
			<>
				<Button intent={Intent.PRIMARY} onClick={() => window.open(props.task.runUrl, "_blank")}>Run</Button>
				<Button intent={Intent.PRIMARY} onClick={() => window.open(props.task.runUrl + "?config=config_test", "_blank")}>Run(Test Config)</Button>
			</>}
		{props.task.status === "failed" && <Button intent={Intent.WARNING} onClick={() => API.get("build", { project: props.task.project, revision: props.task.revision }).then(appContext.updateTasks)}>Restart</Button>}
		{props.task.status === "pending" && <Button intent={Intent.NONE} >Remove</Button>}
	</Card>;
}

export function TaskListView(props: {tasks: BuildTask[]})
{
	return <>{props.tasks.map((t) => <TaskView task={t} />)}</>;
}

export function ProjectTree()
{
	let appState = React.useContext(AppContext);

	let tree: ITreeNode[] = appState.projects.map((p) =>
		({
			id: p.name,
			icon: "folder-open",
			isExpanded: true,
			label: p.name,
			childNodes: p.branches.map((branch) =>
				({
					id: branch.name,
					icon: "tag",
					label: branch.name,
					secondaryLabel: <Icon icon="play" intent={Intent.SUCCESS} />,
					childNodes: branch.tasks.map((task) => ({
						id: task.id,
						label: `Task ${task.id}`,
						icon: "play",
					}))
				}))
		}));
	return < Tree contents={tree} />;
}

function showIssue(issue: string)
{
	window.open(`https://rockstonedev.atlassian.net/browse/${issue}`, "_blank");
}