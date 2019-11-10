export const config = {
	projects: {
		bottle_client_mobile: {
			repositoryUrl: "https://hg.rockstonecorp.com/bottle_client_mobile",
			respositoryFolder: "../bottle_client_mobile",

			scripts: {
				repo_prepare: (revision: string) => `
				hg pull -r ${revision}
				hg update -r ${revision} --clean
				hg clean --all
				npm install
				cd deploy
				npm install
				gulp make -f gulp_deploy.js
			`,
			}
		}
	}
}