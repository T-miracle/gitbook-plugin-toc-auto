module.exports = function (book, page, mtime, birthtime) {
	/**
	 * 在package.json中配置的默认值，这里可以直接使用
	 * [config: config option]
	 * @type {Object}
	 */
	var config = book.config.get('pluginsConfig')['toc-auto'];

	var wrapIfMarkdown = function (input) {
		if (!config.markdown) {
			return input;
		} else {
			return book.renderInline('markdown', input);
		}
	};
	if (page.path !== 'README.md' && page.path !== config.xpath + '.md') {
		return Promise.all([wrapIfMarkdown(config.copyright), wrapIfMarkdown(config.createLabel), wrapIfMarkdown(config.updateLabel)]).then(function (
			labels
		) {
			let copyright = labels[0];
			let createLabel = labels[1];
			let updateLabel = labels[2];
			page.content +=
				'\n\n' +
				[
					'<footer class="page-footer">',
					'<span class="page-footer-copyright">',
					copyright,
					'</span>',
					'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
					'<span class="page-footer-footer-update">',
					createLabel,
					birthtime,
                    '&nbsp;&nbsp;',
					updateLabel,
					mtime,
					'</span>',
					'</footer>',
				].join(' ');
			return page;
		});
	} else {
		return page;
	}
};
