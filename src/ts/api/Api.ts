import { TaskStatus } from "../../../ci/BuildTask";
import { ServerCI } from "../../../ServerCI";
export class Api
{
	private readonly endpoint = "/api/";

	public taskkill(query: { id: number })
	{
		return this.exec<ReturnType<ServerCI["taskkill"]>>("taskkill", query);
	}

	public build(query: { project?: string, revision?: string })
	{
		return this.exec<ReturnType<ServerCI["build"]>>("build", query);
	}
	public tasklist(query: { ids?: number[], status?: TaskStatus })
	{
		return this.exec<ReturnType<ServerCI["tasklist"]>>("tasklist", { ids: query.ids && query.ids.join(","), status });
	}

	private async exec<T>(path: string, params: any)
	{
		let response = await fetch(makeUrl(this.endpoint + "/" + path, params)).then((r) => r.json());
		return response as any as T;
	}
}
export const API = new Api();

function clean(input: any): any
{
	let result = {};
	Object.entries(input).forEach((e) => e[1] === undefined || e[1] === "" || (result[e[0]] = e[1]));
	return result;
}

function makeUrl(url: string, params: string)
{
	return url + "?" + Object.entries(clean(params)).map((e) => `${e[0]}=${encodeURIComponent(e[1] as string)}`).join("&");
}