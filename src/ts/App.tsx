import { Blockquote, Button, ButtonGroup, Card, Code, Collapse, Divider, H3, Intent, Label, Pre, Spinner, Switch, Tab, Tabs, Tag, UL, Navbar, Alignment, AnchorButton, HTMLSelect, InputGroup } from "@blueprintjs/core";
import React = require("react");

import "@blueprintjs/core/lib/css/blueprint.css";
import "normalize.css";

import { DARK } from "@blueprintjs/core/lib/esm/common/classes";
import { BuildTask } from "../../ci/BuildTask";
import { API } from "./api/Api";
import { Async } from "./utils/Async";

export class App extends React.Component<{}, { darkMode: boolean }>
{
	public state = {
		darkMode: false,
	}

	public render()
	{
		return <div className={this.state.darkMode ? DARK : ""}>
			<Navbar style={{ position: "sticky", top: 0}}>
				<Navbar.Group align={Alignment.LEFT}>
					<Navbar.Heading>RoCI</Navbar.Heading>
					<Navbar.Divider />
					<AnchorButton className="bp3-minimal" icon="home" text="Home" href="/" />
					<Navbar.Group>
						<RunTaskWidget/>
					</Navbar.Group>
				</Navbar.Group>
				<Navbar.Group align={Alignment.RIGHT}>
					<Switch checked={this.state.darkMode} innerLabelChecked="Dark" innerLabel="Light" onChange={() => this.setState((state) => ({ darkMode: !state.darkMode }))} large={true} style={{margin: "auto"}}/>
				</Navbar.Group>
			</Navbar>

			<Async promise={API.tasklist({})}>
				{(tasks) => <TaskListView tasks={tasks.tasks} />}
			</Async>
		</div>;
	}
}

function RunTaskWidget()
{
	let select = React.useRef<HTMLSelectElement>();
	let revInput = React.useRef<HTMLInputElement>();
	return <>
		<HTMLSelect ref={select as any}>
			<option disabled>project</option>
			<option value={"bottle_client_mobile"}>bottle_client_mobile</option>
		</HTMLSelect>
		<InputGroup ref={revInput as any} placeholder="Branch/Revision" />
		<Button text="Run" onClick={() => API.build({ project: select?.current?.value.toString(), revision: revInput.current.value })}/>
	</>;
}

export class TaskView extends React.Component<{ task: BuildTask }, { }>
{
	public state = {
	};

	public render()
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
		};

		let logs = <iframe src={this.props.task.logPath} style={infoStyle} />;
		let commits = <div style={infoStyle}>
			{
				this.props.task.commits && this.props.task.commits.map((commit) =>
					<Blockquote>
						<Tag>{commit.branch}</Tag> <Tag minimal={true}>{commit.author}</Tag> {commit.issues.map((issue) => <Tag intent={Intent.SUCCESS} interactive={true} onClick={() => showIssue(issue)}>{issue}</Tag>)}
						<br />
						<Code>{commit.message}</Code>
					</Blockquote>
				)}
		</div>;

		return <Card style={{margin: "10px"}}>
			<H3>{`Task #${this.props.task.id} `}</H3>
			<p>`${this.props.task.project}/${this.props.task.revision}`</p>
			<Tag intent={statusIntents[this.props.task.status]}>{this.props.task.status}</Tag>
			<Tabs renderActiveTabPanelOnly={true}>
				<Tab id="changes" title="Changes" panel={commits} />
				<Tab id="build_log" title="Build Log" panel={logs} />
				<Tabs.Expander />
			</Tabs>

			<Divider />

			{this.props.task.status === "running" && <Button intent={Intent.DANGER} onClick={() => API.taskkill({ id: this.props.task.id })}>Stop</Button>}
			{this.props.task.status === "completed" && <Button intent={Intent.PRIMARY} onClick={() => window.open(this.props.task.runUrl, "_blank")}>Run</Button>}
			{this.props.task.status === "failed" && <Button intent={Intent.WARNING} onClick={() => API.build({project: this.props.task.project, revision: this.props.task.revision})}>Restart</Button>}
			{this.props.task.status === "pending" && <Button intent={Intent.NONE} >Remove</Button>}
		</Card>;
	}
}

export class TaskListView extends React.Component<{tasks: BuildTask[]}>
{
	public render()
	{
		return this.props.tasks.map((t) => <TaskView task={t}/>);
	}
}

function showIssue(issue: string)
{
	window.open(`https://rockstonedev.atlassian.net/browse/${issue}`, "_blank");
}