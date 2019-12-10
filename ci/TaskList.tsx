import { BuildTask } from "./BuildTask";

export class TaskQueue
{
	private taskQueue: BuildTask[] = [];
	private executing: boolean = false;
	
	public addTask(task: BuildTask)
	{
		this.taskQueue.push(task);
		this.executeTasks();
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

export class BuildTaskList
{
	private queues: { [key: string]: TaskQueue } = {};
	public readonly tasks: { [key: number]: BuildTask } = {};

	public addTask(task: BuildTask)
	{
		this.tasks[task.id] = task;
	}

	public runTask(task: BuildTask): BuildTask
	{
		this.addTask(task);

		let queue = this.queues[task.project] || (this.queues[task.project] = new TaskQueue());
		queue.addTask(task);
		return task;
	}
}