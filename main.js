const zlib = require('zlib')
const drop = require('drag-and-drop-files')
const fileReaderStream = require('filereader-stream')
const concat = require('concat-stream')
const $ = require('jquery')

var LOADED_DATA = null

function LoadSubmarine(xmlData) {
	var $xmlData = $(xmlData)
	var $submarine = $xmlData.find('Submarine')

	var name = $submarine.attr('name')
	console.log(`Opened ${name} successfully`)

	LOADED_DATA = { xmlData, $xmlData, $submarine, name }

	$('#tools').attr('hidden', false)
	$('#loadedInfo .name').text(name)

	// shuttle extract button - generated dynamically
	$('.shuttleButton').remove()
	$submarine.find('LinkedSubmarine').each(function () {
		var name = $(this).attr('name')
		var button = $(`<div class="shuttleButton extractButton">Extract "${name}"</div>`)
		$('#buttonsWrapper').append(button)
		button.on('click', async () => {
			var string = $(this)
				.prop('outerHTML')
				.replace(/LinkedSubmarine/g, 'Submarine')

			var output = zlib.gzipSync(string)

			var blob = new Blob([output.buffer], { type: 'application/gzip' })
			var blobUrl = URL.createObjectURL(blob)

			var a = document.createElement('a')
			a.href = blobUrl
			a.download = `${name}.sub`
			a.click()

			console.log(`Prompted to download ${name}.sub`)
		})
	})
}

// file upload handler
function handleFileUpload(files) {
	var file = files[0]

	if (!file.name.endsWith('.sub')) {
		window.alert('Selected file is not a ".sub" file')
		return console.warn('Selected file is not a ".sub" file')
	}

	fileReaderStream(file).pipe(
		concat(function (contents) {
			var output = zlib.gunzipSync(contents).toString('utf-8')
			console.log('File loaded successfully')
			var xmlData = $.parseXML(output)
			LoadSubmarine(xmlData)
		})
	)
}

// dropbox hadling
drop(document.getElementById('drop'), handleFileUpload)

// click on dropbox handing
$('#drop').on('click', () => {
	$('#hiddenFileInput').trigger('click')
})

$('#hiddenFileInput').on('change', () => {
	let files = $('#hiddenFileInput')[0].files
	if (files.length < 1) return
	handleFileUpload(files)
})

// extract image
$('#extractImage').on('click', () => {
	if (!LOADED_DATA) return console.error('No submarine loaded')
	var base64 = LOADED_DATA.$submarine.attr('previewimage')

	var a = document.createElement('a')
	a.href = 'data:image/png;base64,' + base64
	a.download = `${LOADED_DATA.name}.png`
	a.click()
	console.log(`Prompted to download ${LOADED_DATA.name}.png`)
})

// help popup
$('#fileLocHelp').on('click', () => {
	window.alert(`Submarines can be found in "Barotrauma\\Submarines", or if they were installed from steam workshop, in "Barotrauma\\Mods\\[Package name]"\n\nTo find your "Barotrauma folder" right click on barotrauma in your steam library, select "properties", go to "local file" tab and click "Browse..."`)
})
