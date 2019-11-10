export const config = {
	httpPort: 8080,
	httpsPort: 8081,
	projects: {
		bottle_client_mobile: {
			repositoryUrl: "https://hg.rockstonecorp.com/bottle_client_mobile",
			respositoryFolder: "../bottle_client_mobile",

			scripts: {
				repo_prepare: (revision: string) => `
				hg pull -r ${revision}
				hg update -r ${revision} --clean
				hg clean --all
				echo {} > ./deploy/deploy.private.json
				mkdir .tmp
				npm install
				cd deploy
				npm install
				gulp make -f gulp_deploy.js
			`,
			}
		}
	}
}