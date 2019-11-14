import React = require("react");
import { API, IBuildTask, IServerCI } from "./api/Api";

export class AppState
{
	public taskFilter: Parameters<IServerCI["tasklist"]>[0];
	public filteredTasks: IBuildTask[] = [];

	public projects: ReturnTypeDP<IServerCI["projects"]>["result"] = [];

	public constructor(update: () => void)
	{
		this.updateTasks();
		this.updateProjects();
		update();
		this.update = update;
		setInterval(() => this.updateAll());
	}

	public async updateTasks()
	{
		this.filteredTasks = (await API.get("tasklist", this.taskFilter)).tasks;
		this.updateProjects();
	}

	public async updateProjects()
	{
		this.projects = (await API.get("projects")).result;
		this.update();
	}

	public updateAll()
	{
		this.updateTasks();
		this.updateProjects();
	}
	private update = () => { };
}

export const AppContext = React.createContext<AppState>(undefined);
