import { config } from "./ci-config";
import { BuildTask, TaskStatus } from "./ci/BuildTask";
import { TaskList } from "./ci/TaskList";

export class ServerCI
{
	private readonly tasks = new TaskList();
	public tasklist(query: { ids?: string, status?: TaskStatus })
	{
		let filters: ((t: BuildTask) => boolean)[] = [];

		if (query.ids)
		{
			let ids = query.ids.split(",").map((id) => id as any | 0);
			filters.push((task) => ids.some((id) => id === task.id));
		}

		if (query.status)
			filters.push((task) => task.status === query.status);

		return { tasks: this.tasks.tasks.filter((task) => filters.every((f) => f(task))) };
	}

	public taskkill(query: { id: number })
	{
		let task = this.tasks.tasks[query.id];

		if (!task)
			return { result: `Task #${query.id} not found` };

		if (task.terminator)
			task.terminator();

		return { result: "Success" };
	}

	public build(query: { project?: string, revision?: string })
	{
		let project = query.project as any || "bottle_client_mobile";
		let revision = query.revision || "default";

		if (!(project in config.projects))
		{
			return { error: `Unknown project '${project}'` };
		}

		let task = this.tasks.runTask(new BuildTask(project, revision));
		return { taskId: task.id };
	}
}