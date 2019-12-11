import { Alignment, AnchorButton, Blockquote, Button, ButtonGroup, Callout, Card, Code, Collapse, Divider, H3, HTMLSelect, InputGroup, Intent, Label, Navbar, Pre, Spinner, Switch, Tab, Tabs, Tag, UL, Tree, ITreeNode, Icon, Popover, MenuItem, Menu } from "@blueprintjs/core";
import React = require("react");

import "normalize.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "./App.css";

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
			<div className={(this.state.darkMode ? DARK : "") + " bp3-bg flex-v h100"}>
				<Navbar style={{ position: "sticky", top: 0 }}>
					<Navbar.Group align={Alignment.LEFT}>
						<Navbar.Heading>RoCI</Navbar.Heading>
						<Navbar.Divider />
					</Navbar.Group>
					<Navbar.Group align={Alignment.RIGHT}>
						<Switch checked={this.state.darkMode} innerLabelChecked="Dark" innerLabel="Light" onChange={() => this.setState((state) => ({ darkMode: !state.darkMode }))} large={true} style={{ margin: "auto" }} />
					</Navbar.Group>
				</Navbar>
				<div className="flex-h h100">
					<Callout className="h100 scroll-v">
						<ProjectTree />
					</Callout>
					<Callout className="h100 scroll-v">
						<AppContext.Consumer>
							{(state) => <TaskListView tasks={state.filteredTasks} />}
						</AppContext.Consumer>
					</Callout>
				</div>
			</div>
		</AppContext.Provider>;
	}
}

export function TaskView(props: { task: BuildTask })
{
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
		<H3>{`#${props.task.id} ${props.task.project}/${props.task.revision}`} <TaskStatusTag large={true} style={{ float: "right" }} status={props.task.status}/></H3>
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
			{props.task.status === "completed" && props.task.runTask &&
				<Tab id="run_log" title="Run Log" panel={<iframe src={props.task.runTask.logPath} style={infoStyle} />} />}
			<Tabs.Expander />
		</Tabs>

		<Divider />

		{props.task.status === "running" && <Button intent={Intent.DANGER} onClick={() => API.get("taskkill", { id: props.task.id }).then(appContext.updateTasks)}>Stop</Button>}
		{props.task.status === "completed" && props.task.runUrl &&
			<>
				<Button intent={Intent.PRIMARY} onClick={() => window.open(props.task.runUrl, "_blank")}>Run</Button>
				<Button intent={Intent.PRIMARY} onClick={() => window.open(props.task.runUrl + "?config=config_test", "_blank")}>Run(Test Config)</Button>
			</>}
		{props.task.status === "completed" && props.task.runTask &&
			<>
			{props.task.runTask.status != "running"
				? <Button intent={Intent.PRIMARY} onClick={() => API.get("runtask", { id: props.task.id })}>Run Instance</Button>
				: <Button intent={Intent.PRIMARY} onClick={() => API.get("stoptask", { id: props.task.id })}>Stop Instance</Button>
			}
		</>}
		{props.task.status === "failed" && <Button intent={Intent.WARNING} onClick={() => API.get("build", { project: props.task.project, revision: props.task.revision }).then(appContext.updateTasks)}>Restart</Button>}
		{props.task.status === "pending" && <Button intent={Intent.NONE} >Remove</Button>}
	</Card>;
}

export function TaskStatusTag(props: { status: string, style?: React.CSSProperties, large?: boolean })
{
	let statusIntents = {
		pending: Intent.NONE,
		running: Intent.PRIMARY,
		completed: Intent.SUCCESS,
		failed: Intent.DANGER
	};

	return <Tag intent={statusIntents[props.status]} {...props}>{props.status}</Tag>;
}

export function TaskListView(props: {tasks: BuildTask[]})
{
	return <>{props.tasks.map((t) => <TaskView task={t} />)}</>;
}

export function ProjectTree()
{
	let appState = React.useContext(AppContext);
	let [state, setState] = React.useState({ selected: null as string | number, closed: {} });
	let tree: ITreeNode[] = appState.projects.map((p) =>
		({
			id: p.name,
			icon: "folder-open",
			label: p.name,
			filter: {projects: p.name},
			get isExpanded() { return !state.closed[this.id]; },
			get isSelected() { return state.selected == this.id; },
			childNodes: p.branches.sort((a, b) => (b.tasks[0] && new Date(b.tasks[0].timings.create).getTime() || 0) - (a.tasks[0] && new Date(a.tasks[0].timings.create).getTime() || 0)).map((branch) =>
				({
					id: `${p.name}/${branch.name}`,
					icon: "tag",
					label: branch.name,
					secondaryLabel:
						<Popover content={
							<Menu>
								<MenuItem text="Build" onClick={async () => 
								{
									await API.get("build", { project: p.name, revision: branch.name });
									appState.updateTasks();
								}}/>
							</Menu>
						}>
							<Icon icon="menu" />	
						</Popover>,
					filter: {revisions: branch.name, projects: p.name},
					get isExpanded() { return !state.closed[this.id]; },
					get isSelected() { return state.selected == this.id; },
					childNodes: branch.tasks.length == 0 ? undefined : branch.tasks.map((task) => ({
						id: `${p.name}/${branch.name}/${task.id}`,
						label: `Task ${task.id}`,
						icon: "build",
						filter: {ids: task.id},
						get isExpanded() { return !state.closed[this.id]; },
						get isSelected() { return state.selected == this.id; },
						secondaryLabel: <div style={{display: "flex"}}><TaskStatusTag status={task.status} />{task.runTask && task.runTask.status == "running" && <Spinner size={15} />}</div>
					}))
				}))
		}));

	let handlers = {
		onNodeClick: (nodeData: ITreeNode, _nodePath: number[], e: React.MouseEvent<HTMLElement>) =>
		{
			state.selected = nodeData.id;
			appState.taskFilter = nodeData["filter"];
			appState.updateTasks();
			setState({...state});
		},

		onNodeCollapse: (nodeData: ITreeNode) =>
		{
			state.closed[nodeData.id] = true;
			setState({...state});
		},

		onNodeExpand: (nodeData: ITreeNode) =>
		{
			state.closed[nodeData.id] = false;
			setState({...state});
		}
	};

	let forEachNode = (nodes: ITreeNode[], callback: (node: ITreeNode) => void) =>
	{
		if (nodes == null)
		{
			return;
		}

		for (const node of nodes)
		{
			callback(node);
			forEachNode(node.childNodes, callback);
		}
	}

	return < Tree contents={tree} {...handlers}/>;
}

function showIssue(issue: string)
{
	window.open(`https://rockstonedev.atlassian.net/browse/${issue}`, "_blank");
}