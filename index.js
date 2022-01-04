const fs = require('fs');
const footer = require('./lib/plugin');
const moment = require('moment');
var Entities = require('html-entities').AllHtmlEntities;
var Html = new Entities();

var indexPage = new Array();

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
			if (page.path !== 'README.md') {
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
				indexPage.push(doc);
				indexPage = indexPage.sort((x, y) => {
					return x.birthtime < y.birthtime;
				});
				if (indexPage.length > 10) indexPage.pop();
			}
			return page;
		},
		finish: function () {
			let _indexPage = ``;
			for (let i = 0; i < indexPage.length; i++) {
				_indexPage += `
				<div class="article-box">
					<div class="article-title"><a href="${indexPage[i].url}">${indexPage[i].title}</a></div>
					<div class="article-createtime">${indexPage[i].ctime}</div>
					<div class="article-content">${indexPage[i].content}</div>
				</div>`;
			}
			indexPage = [];
			let indexHtml = fs.readFileSync(this.output.resolve('index.html'), 'utf8');
			indexHtml = indexHtml.replace('<p>${text}</p>', _indexPage);
			return this.output.writeFile('index.html', indexHtml);
		},
	},
	filters: {
		dateFormat: function (d, format) {
			return moment(d).format(format);
		},
	},
};
