import React = require("react");
import { API, IBuildTask, IServerCI } from "./api/Api";

export class AppState
{
	public taskFilter: Parameters<IServerCI["tasklist"]>[0];
	public filteredTasks: IBuildTask[] = [];

	public projects: ReturnTypeDP<IServerCI["projects"]>["result"] = [];

	public constructor(update: () => void)
	{
		this.updateAll();
		update();
		this.update = update;
		setInterval(() => this.updateAll(), 60 * 1000);
	}

	public async updateTasks()
	{
		this.filteredTasks = (await API.get("tasklist", this.taskFilter)).tasks;
		this.update();
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
