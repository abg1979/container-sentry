module.exports = {
	// Global options:
	sourceDir: 'build/webpack',

	// Command options:
	build: {
		overwriteDest: true,
	},
	run: {
		firefox: 'firefoxdeveloperedition',
		browserConsole: true,
		firefoxProfile: 'webext',
		keepProfileChanges: true,
	}
}
