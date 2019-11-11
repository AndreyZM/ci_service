import { BuildTask } from "./BuildTask";
export class TaskList
{
	private executing: boolean = false;
	public readonly tasks: BuildTask[] = [];
	public runTask(task: BuildTask): BuildTask
	{
		task.id = this.tasks.push(task) - 1;
		this.executeTasks();
		return task;
	}
	private async executeTasks()
	{
		if (this.executing)
			return;

		this.executing = true;

		try
		{
			for (let t of this.tasks)
				await t.start();
		}
		finally
		{
			this.executing = false;
		}
	}
}
