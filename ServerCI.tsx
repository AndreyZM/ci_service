import { config } from "./ci-config";
import { BuildTask } from "./ci/BuildTask";
import { RhodeApi } from "./ci/RhodeApi";
import { BuildTaskList } from "./ci/TaskList";
import { TaskStatus } from "./ci/TaskStatus";

let Rhode = new RhodeApi(config.rhode.host, config.rhode.key);
export class ServerCI
{
	private readonly tasks = new BuildTaskList();
	public tasklist(query: { ids?: string, status?: TaskStatus, projects?: string, revisions?: string})
	{
		let filters: ((t: BuildTask) => boolean)[] = [];

		if (query.ids)
		{
			let ids = query.ids.split(",").map((id) => id as any | 0);
			filters.push((task) => ids.some((id) => id == task.id));
		}

		if (query.projects)
		{
			let projects = query.projects.split(",");
			filters.push((task) => projects.some((project) => project === task.project));
		}

		if (query.revisions)
		{
			let revisions = query.revisions.split(",");
			filters.push((task) => revisions.some((revision) => revision === task.revision));
		}

		if (query.status)
			filters.push((task) => task.status === query.status);

		return { tasks: Object.values(this.tasks.tasks).filter((task) => filters.every((f) => f(task))) };
	}

	public async projects()
	{
		return {
			result: await Promise.all(Object.entries(config.projects).map(async ([projectName, value]) =>
			{
				let refs = await Rhode.callMethod("get_repo_refs", { repoid: projectName });
				return {
					name: projectName, ...value,
					branches: Object.keys(refs.result.branches).map(
						(key) =>
							({
								name: key,
								tasks: Object.values(this.tasks.tasks)
									.filter((t) => t.project === projectName && t.revision === key).reverse()
							}))
				};
			}))
		};
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

	public runtask(query: { id: number })
	{
		this.tasks.tasks[query.id].runTask.start();
	}

	public stoptask(query: { id: number })
	{
		this.tasks.tasks[query.id].runTask.stop();
	}

	public build(query: { project?: string, revision?: string })
	{
		let project = query.project as any || "bottle_client_mobile";
		let revision = query.revision || "default";

		if (Object.values(this.tasks.tasks).some((t) => t.project === project && t.revision === revision && t.status === "pending"))
		{
			return error("Same task is pending...");
		}

		if (!(project in config.projects))
		{
			return error(`Unknown project '${project}'`);
		}

		let task = this.tasks.runTask(config.projects[project].createTask(project, revision));
		return { taskId: task.id };
	}
}

function error(message: string)
{
	console.warn(message);
	return { error: message };
}

function objectMap<T, V>(array: T[], s: (v: T, target) => void, target: V )
{
	array.forEach((item) => s(item, target));
	return target;
}