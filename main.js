const zlib = require('zlib')
const drop = require('drag-and-drop-files')
const fileReaderStream = require('filereader-stream')
const concat = require('concat-stream')
const $ = require('jquery')

var LOADED_DATA = null

function LoadSubmarine(xmlData) {
	var $submarine = $(xmlData).find('Submarine')

	var name = $submarine.attr('name')
	if (!name) return window.alert(`Failed to read file.`)
	console.log(`Opened ${name} successfully`)
	showMsg(`Opened <span>${name}</span> successfully`)

	LOADED_DATA = { $submarine, name }

	$('#tools').show()
	$('#downloadPrompt').hide()
	$('#loadedInfo .name').text(name)

	// #region shuttle extract buttons
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
			showMsg(`Prompted to download <span>${name}.sub</span>`)
		})
	})
	// #endregion shuttle extract buttons

	// #region tools default values
	$('#priceInput').val($submarine.attr('price'))
	// #endregion tools default values
}

// #region files handling

// file upload handler
function handleFileUpload(files) {
	var file = files[0]

	fileReaderStream(file).pipe(
		concat(function (contents) {
			if (file.name.endsWith('.sub')) {
				var output = zlib.gunzipSync(contents).toString('utf-8')
				console.log('File loaded successfully')
				var xmlData = $.parseXML(output)
				LoadSubmarine(xmlData)
			} else if (file.name.endsWith('.xml')) {
				var string = contents.toString('utf-8')
				console.log('File loaded successfully')
				var xmlData = $.parseXML(string)
				LoadSubmarine(xmlData)
			} else {
				window.alert('Selected file is not a ".sub" file')
				return console.warn('Selected file is not a ".sub" file')
			}
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

// download button
$('#downloadButton').on('click', () => {
	let name = LOADED_DATA.name
	let string = LOADED_DATA.$submarine.prop('outerHTML')

	var output = zlib.gzipSync(string)

	var blob = new Blob([output.buffer], { type: 'application/gzip' })
	var blobUrl = URL.createObjectURL(blob)

	var a = document.createElement('a')
	a.href = blobUrl
	a.download = `${name}.sub`
	a.click()

	console.log(`Prompted to download ${name}.sub`)
	showMsg(`Prompted to download <span>${name}.sub</span>`)

	$('#downloadPrompt').hide()
})

// #endregion files handling

// extract image
$('#extractImage').on('click', () => {
	if (!LOADED_DATA) return console.error('No submarine loaded')
	var base64 = LOADED_DATA.$submarine.attr('previewimage')

	var a = document.createElement('a')
	a.href = 'data:image/png;base64,' + base64
	a.download = `${LOADED_DATA.name}.png`
	a.click()
	console.log(`Prompted to download ${LOADED_DATA.name}.png`)
	showMsg(`Prompted to download <span>${LOADED_DATA.name}.png</span>`)
})

// help popup
$('#fileLocHelp').on('click', () => {
	var infobox = $(`<div id="infoBox"></div>`)
	var close = $(`<div id=closeInfoBox>X</div>`)
	var textWrapper = $(`<div class="text"></div>`)
	textWrapper.html(`
	<h3>Submarines can be found in:</h3><ul>
	<li><span class="highlight">Barotrauma\\Submarines</span> - if they were created or modified by you</li>
	<li><span class="highlight">Barotrauma\\Submarines\\Downloaded</span> - if they were downloaded when joining server</li>
	<li><span class="highlight">Barotrauma\\Mods\\[package name]</span> - if they were downloaded from steam workshop</li>
	</ul>
	To find your <span class="highlight">Barotrauma</span> folder right click on barotrauma in your steam library, select "properties", go to "local files" tab and click "Browse..."
	`)
	infobox.append(close).append(textWrapper)
	close.on('click', () => {
		close.off('click')
		infobox.remove()
	})
	$(document.body).append(infobox)
})

// "console" popups
function showMsg(msg) {
	let entry = $(`<div class="consoleMsg">[${new Date().toLocaleTimeString()}] - ${msg}</div>`)
	entry.appendTo($('#console')).hide().fadeIn(1000)
	setTimeout(() => {
		entry.fadeOut(1000, () => {
			entry.remove()
		})
	}, 1000 * 5)
}

// #region tools
$('#priceConfirm').on('click', () => {
	let value = $('#priceInput').val()
	console.log(`setting price to ${value} marks`)
	showMsg(`setting price to ${value} marks`)

	LOADED_DATA.$submarine.attr('price', value)

	$('#downloadPrompt').show()
})
// #endregion tools
