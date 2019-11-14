import React = require("react");
import { API, IBuildTask, IServerCI } from "./api/Api";

export class AppState
{
	public taskFilter: Parameters<IServerCI["tasklist"]>[0];
	public filteredTasks: IBuildTask[] = [];

	public projects: ReturnTypeDP<IServerCI["projects"]>["result"] = [];

	constructor(private update: () => void)
	{
		this.updateTasks();
		this.updateProjects();
	}

	public async updateTasks()
	{
		this.filteredTasks = (await API.get("tasklist", this.taskFilter)).tasks;
		this.update();
	}

	public async updateProjects()
	{
		this.projects = (await API.get("projects")).result;
	}
}

export const AppContext = React.createContext<AppState>(undefined);
