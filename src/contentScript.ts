import * as dayjs from 'dayjs'

class TimeLineItem {
    constructor(private date:string, private content:string[] = []) {
    }

    public addContent(text:string) {
        this.content.push(text);
    }

    public render(md:any, env:any):string {
        return `<div class="timeline-item">
        <div class="timeline-header">
          <h3 class="timeline-date">
            ${this.date}
          </h3>
        </div>
        <div class="timeline-content">${md.render(this.content.join('\n'), env)}</div>
        </div>`
    }
}

function render(md:any, content:string, env:Object) {
    const contentList = content.split('\n');
    const timelineList:TimeLineItem[] = [];

    let timelineItem:TimeLineItem;

    for (let idx = 0; idx < contentList.length; idx++) {
        const currContent = contentList[idx];

        const matchDate = /^Date: (.*)$/.exec(currContent);
        if (matchDate) {
            let date = matchDate[1].trim();
            if (dayjs(date).isValid()) {
                date = dayjs(date).format('YYYY/M/D ddd')
            } else {
                date = 'Error format';
            }

            timelineItem = new TimeLineItem(date);
            timelineList.push(timelineItem);
        } else {
            if (!timelineItem) {
                timelineItem = new TimeLineItem('Error format');
                timelineList.push(timelineItem);
            } 

            timelineItem.addContent(currContent);
        }
    }

    return `<div class="timeline-container">${
        timelineList.map((item)=> item.render(md, env)).join('')
    }</div>`
}

export default (context: { contentScriptId: string, postMessage: any }) => {
    return {
        plugin: (markdownIt, pluginOptions) => {
			const defaultRender = markdownIt.renderer.rules.fence || function(tokens, idx, options, env, self) {
				return self.renderToken(tokens, idx, options, env, self);
			};

            markdownIt.renderer.rules.fence = function(tokens, idx, options, env, self) {
                console.log(tokens, idx, options, env, self);
				const token = tokens[idx];
				if (token.info !== 'timeline') return defaultRender(tokens, idx, options, env, self);

				return render(markdownIt, token.content, env);
			};
        },
        assets: function () {
            return [
                { name: 'timeline.css' },
            ];
          }
    };
};