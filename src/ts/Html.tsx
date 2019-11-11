
export function htmlPage(content: string, props: {lang: string})
{
	return `<!DOCTYPE html>
		<html lang="${props.lang}" xmlns="http://www.w3.org/1999/xhtml" xml:lang=en" xmlns:fb="http://www.facebook.com/2008/fbml" xmlns:og="http://ogp.me/ns#" >
		${content}
		</html>`;
}