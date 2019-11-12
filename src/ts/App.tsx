import { Button, Card, Collapse, Intent, Label, Pre, Spinner, Tag, Divider, H3, UL, Blockquote } from "@blueprintjs/core";
import React = require("react");

import "@blueprintjs/core/lib/css/blueprint.css";
import "normalize.css";

import { BuildTask } from "../../ci/BuildTask";
import { Api, API } from "./api/Api";
import { Async } from "./utils/Async";
import { BLOCKQUOTE } from "@blueprintjs/core/lib/esm/common/classes";

export class App extends React.Component
{
	public render()
	{
		return <div>
			<Card>
				<h2>Task list</h2>
				<Async promise={API.tasklist({})}>
					{(tasks) => <TaskListView tasks={tasks.tasks}/>}
				</Async>
			</Card>
		</div>;
	}
}

export class TaskView extends React.Component<{ task: BuildTask }, { showLogs: boolean }>
{
	public state = {
		showLogs: false
	};

	public render()
	{
		let statusIntents = {
			pending: Intent.NONE,
			running: Intent.PRIMARY,
			completed: Intent.SUCCESS,
			failed: Intent.DANGER
		};

		return <Card>
			<H3>{`Task #${this.props.task.id} ${this.props.task.project}/${this.props.task.revision}`}<Tag intent={statusIntents[this.props.task.status]}>{this.props.task.status}</Tag></H3>
			<Button onClick={() => this.setState((state) => ({ showLogs: !state.showLogs }))}>
				{this.state.showLogs ? "Hide" : "Show"} logs
			</Button>
			<Collapse isOpen={this.state.showLogs} >
				<Pre style={{ whiteSpace: "pre-line" }}>
					<iframe src={this.props.task.logPath}/>
				</Pre>
			</Collapse>
				<Blockquote>
					<UL>
					{this.props.task.commits.map((commit) => <li>{commit.branch + ":" + commit.author}<br/>{commit.message}</li>)}
					</UL>
				</Blockquote>
			<Divider />
			
			{this.props.task.status === "running" && <Button intent={Intent.DANGER} onClick={() => API.taskkill({ id: this.props.task.id })}>Stop</Button>}
			{this.props.task.status === "completed" && <Button intent={Intent.PRIMARY} onClick={() => window.open(this.props.task.runUrl, "_blank")}>Run</Button>}
			{this.props.task.status === "failed" && <Button intent={Intent.WARNING} >Restart</Button>}
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