import * as psTree from "ps-tree";

export function killTree(pid: any, signal: string = "SIGKILL", callback: () => void = () => { })
{
	var killTree = true;
	if (killTree)
	{
		psTree(pid, function (err, children)
		{
			[pid].concat(
				children.map((p) =>p.PID)
			).forEach(function (tpid)
			{
				try { process.kill(tpid, signal) }
				catch (ex) { }
			});
			callback();
		});
	} else
	{
		try { process.kill(pid, signal) }
		catch (ex) { }
		callback();
	}
};