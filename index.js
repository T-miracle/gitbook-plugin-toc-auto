const fs = require('fs');
const footer = require('./lib/plugin');
const moment = require('moment');
var Entities = require('html-entities').AllHtmlEntities;
var Html = new Entities();

var tocPage = new Array();

module.exports = {
	book: {
		assets: './lib',
		css: ['plugin.css'],
	},
	hooks: {
		'page:before': function (page) {
			let stat = fs.statSync(page.path);
			let mtime = moment(new Date(stat.mtime + 8 * 60 * 60 * 1000)).format('YYYY-MM-DD HH:mm:ss');
			let birthtime = moment(new Date(stat.birthtime + 8 * 60 * 60 * 1000)).format('YYYY-MM-DD HH:mm:ss');
			return footer(this, page, mtime, birthtime);
		},
		page: function (page) {
			let config = this.config.get('pluginsConfig')["toc-auto"];
			let xpath = config.xpath;
			let ignore = config.ignore;
			let sort = config.sort || 1;
			let maxDisplay = config.maxDisplay || 10;
			if (!ignore.includes(page.path)) { // 排除忽略文件
				if (page.path !== 'README.md' && page.path !== xpath + '.md') {
					let text;
					text = page.content;
					text = Html.decode(text);
					text = text.replace(/^.*h1>/g, '');
					text = text.replace(/(<([^>]+)>)/gi, ' ');
					text = text.replace(/[\n ]+/g, ' ');
					/* 
						stats提供了一些关于文件时间相关的选项：
						atime "访问时间" - 上次访问文件数据的时间。
						mtime "修改时间" - 上次修改文件数据的时间。
						ctime "更改时间" - 上次更改文件状态（修改索引节点数据）的时间。
						birthtime "创建时间" - 创建文件的时间
					*/
					let stat = fs.statSync(page.path);
					// console.log(page.path);
					// console.log('atime  ' + moment(new Date(stat.atime + 8 * 60 * 60 * 1000)).format('YYYY-MM-DD HH:mm:ss'));
					// console.log('mtime  ' + moment(new Date(stat.mtime + 8 * 60 * 60 * 1000)).format('YYYY-MM-DD HH:mm:ss'));
					// console.log('birthtime  ' + moment(new Date(stat.birthtime + 8 * 60 * 60 * 1000)).format('YYYY-MM-DD HH:mm:ss'));
					// console.log('--------');
					let doc = {
						title: page.title,
						content: text.substring(0, 200),
						mtime: moment(new Date(stat.mtime + 8 * 60 * 60 * 1000)).format('YYYY-MM-DD HH:mm:ss'),
						birthtime: moment(new Date(stat.birthtime + 8 * 60 * 60 * 1000)).format('YYYY-MM-DD HH:mm:ss'),
						url: this.output.toURL(page.path),
					};
					tocPage.push(doc);
					tocPage = tocPage.sort((x, y) => {
						if (sort === 1)
							return new Date(x.birthtime) < new Date(y.birthtime) ? 1 : -1;
						if (sort === 2)
							return new Date(x.mtime) < new Date(y.mtime) ? 1 : -1;
					});
					if (tocPage.length > maxDisplay) tocPage.pop();
				}
			}
			return page;
		},
		finish: function () {
			let _tocPage = ``;
			for (let i = 0; i < tocPage.length; i++) {
				_tocPage += `
				<div class="article-box">
					<div class="article-title"><a href="${tocPage[i].url}">${tocPage[i].title}</a></div>
					<div class="article-createtime">${tocPage[i].birthtime}</div>
					<div class="article-content">${tocPage[i].content}</div>
				</div>`;
			}
			tocPage = [];
			let xpath = this.config.get('pluginsConfig')["toc-auto"].xpath;
			let tocHtml = fs.readFileSync(this.output.resolve(xpath + '.html'), 'utf8');
			tocHtml = tocHtml.replace('<p>${toc-auto}</p>', _tocPage);
			return this.output.writeFile(xpath + '.html', tocHtml);
		},
	},
	filters: {
		dateFormat: function (d, format) {
			return moment(d).format(format);
		},
	},
};
