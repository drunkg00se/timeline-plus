import * as dayjs from 'dayjs'
import * as customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

class TimeLineItem {
    constructor(private day:string, private contents:[unix:number, text:string][]) {
    }

    public getDay() {
        return this.day;
    }

    public addContent(contentData:[number, string]) {
        const idx = this.contents.findIndex((data)=> contentData[0] < data[0]);
        if (idx === -1) {
            this.contents.push(contentData);
        } else {
            this.contents.splice(idx, 0, contentData);
        }
    }

    public render(md:any, env:any):string {
        return `<div class="timeline-item">
        <div class="timeline-header">
          <h3 class="timeline-date">
            ${this.day}
          </h3>
        </div>
        ${this.contents.map((content)=>{
            return `<div class="timeline-content">${md.render(content[1], env)}</div>`
            // return `<div class="timeline-content">${md.render(content[1], env)}<p class="timeline-detail">${dayjs(content[0]).local().format('HH:hh:mm')}</p></div>`
        }).join('')}
        </div>`
    }
}

function render(md:any, content:string, env:Object) {
    const INVALID_TIME_FORMAT = 'Invalid Time Format';
    const timelineItemMap: Map<string, TimeLineItem> = new Map();

    const reg = /(?<=^|\n)Date: ([0-9TWZ -_:.,()/+]+?)\n([\s\S]*?)(?=\nDate: ([0-9TWZ -_:.,()/+]+?)\n|$)/g;
    let matchResult;

    while ((matchResult = reg.exec(content)) !== null) {
        let dateStr:string = matchResult[1].trim();
        let day:string;

        let dayObj = dayjs(dateStr, ['DD/MM/YYYY HH:mm', 'DD/MM/YYYY']);
        if (!dayObj.isValid()) {
             dayObj = dayjs(dateStr);
        }

        if (dayObj.isValid()) {
            day = dayObj.format('YYYY/M/D')
        } else {
            day = INVALID_TIME_FORMAT;
        }

        const dateContent:string = matchResult[2];

        if (day!== INVALID_TIME_FORMAT && timelineItemMap.has(day)) {
            timelineItemMap.get(day).addContent([dayObj.unix(), dateContent]);
        } else {
            timelineItemMap.set(day, new TimeLineItem(day, [[dayObj.unix(), dateContent]]));
        }
    }

    const sortTimeline = Array.from(timelineItemMap.values()).sort((a,b) => dayjs(a.getDay()).unix() - dayjs(b.getDay()).unix());

    return `<div class="timeline-container">${sortTimeline.map((item)=> item.render(md, env)).join('')}</div>`
}

export default (context: { contentScriptId: string, postMessage: any }) => {
    return {
        plugin: (markdownIt, pluginOptions) => {
			const defaultRender = markdownIt.renderer.rules.fence || function(tokens, idx, options, env, self) {
				return self.renderToken(tokens, idx, options, env, self);
			};

            markdownIt.renderer.rules.fence = function(tokens, idx, options, env, self) {
				const token = tokens[idx];
				if (token.info !== 'timeline') return defaultRender(tokens, idx, options, env, self);

                    
                // Rich text editor support:
                // The joplin-editable and joplin-source CSS classes mark the generated div
                // as a region that needs special processing when converting back to markdown.
                // This element helps Joplin reconstruct the original markdown.
                const richTextEditorMetadata = `
                <pre
                    class="joplin-source"
                    data-joplin-language="timeline"
                    data-joplin-source-open="\`\`\`timeline\n"
                    data-joplin-source-close="\`\`\`"
                >${markdownIt.utils.escapeHtml(token.content)}</pre>`;


                return `
                <div class="timeline joplin-editable">
                    ${richTextEditorMetadata}
                    ${render(markdownIt, token.content, env)}
                </div>`;
			};
        },
        assets: function () {
            return [
                { name: 'timeline.css' },
            ];
          }
    };
};