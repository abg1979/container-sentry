module.exports = {
	// Global options:
	sourceDir: 'build/webpack',
	artifactsDir: 'dist',

	// Command options:
	build: {
		overwriteDest: true,
		filename: '{name}-{version}.xpi'
	},
	run: {
		firefox: 'firefoxdeveloperedition',
		browserConsole: true,
		firefoxProfile: 'webext',
		keepProfileChanges: true,
	}
}
