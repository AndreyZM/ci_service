import { Button, Card, Spinner, Pre, Collapse } from "@blueprintjs/core";
import React = require("react");

import "@blueprintjs/core/lib/css/blueprint.css";
import "normalize.css";

import { BuildTask } from "../../ci/BuildTask";
import { Api } from "./api/Api";
import { Async } from "./utils/Async";

export class App extends React.Component
{
	private api = new Api();

	public render()
	{
		return <div>
			<Card>
				<h2>Task list</h2>
				<p>Status: </p>
				<Async promise={this.api.tasklist({})}>
					{(tasks) => <TaskListView tasks={tasks.tasks}/>}
				</Async>
			</Card>
		</div>;
	}
}

export class TaskView extends React.Component<{task: BuildTask}, {showLogs: boolean}>
{
	public state = {
		showLogs: false,
	};

	public render()
	{
		return <Card>
			<h3><a href="#">{`Task #${this.props.task.id} ${this.props.task.project}/${this.props.task.revision}`}</a></h3>
			<p>Status: {this.props.task.status}</p>
			<Button onClick={() => this.setState((state) => ({showLogs: !state.showLogs}))}>
					{this.state.showLogs ? "Hide" : "Show"} build logs
			</Button>
			<Collapse isOpen={this.state.showLogs}>
				<Pre style={{ whiteSpace: "pre-line" }}>
					{this.props.task.output}
				</Pre>
			</Collapse>
			<Button>Submit</Button>
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