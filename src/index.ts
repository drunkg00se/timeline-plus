import joplin from 'api';
import { ContentScriptType } from 'api/types';

joplin.plugins.register({
	onStart: async function() {
		// // eslint-disable-next-line no-console
		// console.info('Hello world. Test plugin started!');

       joplin.contentScripts.register(
           ContentScriptType.MarkdownItPlugin,
           'timeline-plus',
           './contentScript.js',
      );
	},
});
