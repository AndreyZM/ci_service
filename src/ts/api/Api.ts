export type IServerCI = typeof import("../../../ServerCI").ServerCI["prototype"];
export type IBuildTask = typeof import("../../../ci/BuildTask").BuildTask["prototype"];

export class Api
{
	private readonly endpoint = "/api/";

	public async get<TMethod extends keyof IServerCI>(method: TMethod, ...args: Parameters<IServerCI[TMethod]>): Promise<ReturnTypeDP<IServerCI[TMethod]>>
	{
		return fetch(makeUrl(this.endpoint + "/" + method, args[0])).then((r) => r.json());
	}

	private async exec<T>(path: string, params?: any)
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

function makeUrl(url: string, params: any)
{
	if (!params)
	{
		params = {};
	}
	return url + "?" + Object.entries(clean(params)).map((e) => `${e[0]}=${encodeURIComponent(e[1] as string)}`).join("&");
}