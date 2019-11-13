import { default as fetch } from "node-fetch";
export class RhodeApi
{
	private callID = 0;
	constructor(private host: string, private key: string)
	{
	}

	public callMethod<TMethod extends keyof IRhodeApiDesc>(method: TMethod, args: IRhodeApiDesc[TMethod]["args"]): Promise<{ result: IRhodeApiDesc[TMethod]["result"] } & IRhodeResponse>
	{
		let request = {
			id: ++this.callID,
			auth_token: this.key,
			method,
			args
		};

		return fetch(this.host,
			{
				method: "POST",
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json"
				},
				body: JSON.stringify(request)
			}).then((r) => r.json()).then((json) =>
			{
				return json;
			}).catch(console.error);
	}
}
interface IRhodeResponse
{
	id: number;
	error: any;
}
interface IRhodeApiDesc {
	get_repo_refs: {
		args: {
			repoid: string;
		}
		result: {
			bookmarks: any,
			branches: any,
			branches_closed: any;
			tags: any,
		}
	}
}