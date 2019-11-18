import { config } from "../../ci-config";

export function formatSlackUser(name: string)
{
	return config.users[name] ? `<@${config.users[name]}>` : name;
}