import { BuildTask } from "./BuildTask";
export class TaskList
{
	private executing: boolean = false;
	public taskQueue: BuildTask[] = [];
	public readonly tasks: { [key: number]: BuildTask } = {};

	public addTask(task: BuildTask)
	{
		this.tasks[task.id] = task;
	}

	public runTask(task: BuildTask): BuildTask
	{
		this.addTask(task);
		this.taskQueue.push(task);
		this.executeTasks();
		return task;
	}

	private async executeTasks()
	{
		if (this.executing)
			return;

		this.executing = true;

		while(this.taskQueue.length > 0)
			await this.taskQueue.shift().start().catch(console.exception);

		this.taskQueue.length = 0;
		this.executing = false;
	}
}
