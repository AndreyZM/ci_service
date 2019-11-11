import { Button, Spinner, Card } from "@blueprintjs/core";
import React = require("react");

import "@blueprintjs/core/lib/css/blueprint.css";
import "normalize.css";
import { TaskList } from "../../ci/TaskList";
import { BuildTask } from "../../ci/BuildTask";
import { Async } from "./utils/Async";
import { Api } from "./api/Api";

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

export class TaskView extends React.Component<{task: BuildTask}>
{
	public render()
	{
		return <Card>
			<h5><a href="#">{`${this.props.task.id} ${this.props.task.project}/${this.props.task.revision}`}</a></h5>
			<p>Status: {this.props.task.status}</p>
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