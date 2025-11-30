import gems from "./gems.js"
import Calc from "./calc.js"

import * as TK from "https://esm.sh/@gesslar/toolkit"

const html = TK.HTML
const disposer = TK.Disposer
const gemDisposer = new TK.DisposerClass()
const notify = TK.Notify
const calc = Calc

const maxGems = 12

console.log(disposer === gemDisposer)

disposer.register(notify.on("DOMContentLoaded", () => {
  const showPasteStageButton = document.querySelector("#showPasteStage")
  const resetGemsButton = document.querySelector("#resetGems")

  const cancelPasteButton = document.querySelector("#cancelpaste")
  const pasteButton = document.querySelector("#pasteButton")

  disposer.register(
    notify.on("click", showPasteStage, showPasteStageButton),
    notify.on("click", calc.resetGems, resetGemsButton),
    notify.on("click", hidePasteStage, cancelPasteButton),
    notify.on("click", paste, pasteButton),
    notify.on("click", hidePasteStage, pasteButton),
  )

  createTable()
}, document))

function showPasteStage() {
  const paste = document.querySelectorAll("[paste]")
  paste.forEach(element => element.classList.toggle("hidden"))
  pasteBox.focus()
}

function hidePasteStage() {
  const paste = document.querySelectorAll("[paste]")
  paste.forEach(element => element.classList.toggle("hidden"))
  pasteBox.blur()
}

function paste() {
  const debugStage = document.querySelector("#debugStage")
  const pasteBox = document.querySelector("#pasteBox")
  const lines = pasteBox.value.split("\n")

  pasteBox.value = ""  // Clear the textarea

  // hidePasteStage()

  const {qualities,types} = gems
  const qualityRegex = qualities.join("|")
  const typeRegex = types.join("|")
  const gemRegex = new RegExp(`(?<quality>${qualityRegex}) (?<type>${typeRegex})`)
  const filtered = lines.filter(line => line.match(gemRegex))

  // Resize the gems table to match the number of gems pasted in.
  if(filtered.length > maxGems) {
    maxGems = filtered.length
    createTable()
  }

  // Re-fetch selects after table creation
  const selects = document.querySelectorAll("select")

  selects.forEach(el => el.value = "none")

  const gemData = filtered.map(el => {
    const {quality,type} = gemRegex.exec(el)?.groups ?? {}

    return {quality,type}
  })

  debugStage.text = String(gemData)

  // Populate the selects with the gem data
  gemData.forEach((gem, index) => {
    if(index < maxGems) {
      const qualitySelect = selects[index * 2] // Assuming quality is first in each group
      const typeSelect = selects[index * 2 + 1] // Assuming type is second

      qualitySelect.value = gem.quality
      typeSelect.value = gem.type
    }
  })

  calc.gemUpdated()
}

function generateOptions(num) {
  const {qualities,types} = gems
  // Prepare the list of gem qualities
  const qualityOptions = qualities.map(e => ({text: capitalize(e), value: e}))
  const typeOptions = types.map(e => ({text: capitalize(e), value: e}))

  const template = document.querySelector("#gemTemplate")
  const root = template.content.cloneNode(true)
  const gemContainer = root.querySelector("div") // the first div in the template
  gemContainer.id = `bloodjewel-select-${num}`

  const name = root.querySelector(".gem-name")
  name.textContent = `Bloodjewel ${num}`

  void[
    ["quality", qualityOptions],
    ["type", typeOptions]
  ].forEach(([select,opts]) => {
    const element = root.querySelector(`.${select}-select`)
    element.name = `${select}-select-${num}`

    opts.forEach(el => {
      const opt = document.createElement("option")
      opt.value = el.value
      opt.text = el.text
      element.appendChild(opt)
    })

    gemDisposer.register(
      notify.on("change", e => calc.gemUpdated(e), element)
    )
  })

  return root
}

function createTable() {
  const stage = document.querySelector("#gemStage")

  // Dispose of any pre-existing event listeners for select boxes
  // before clearing them out.
  gemDisposer.dispose()

  // Clear the stage! EVERYBODY! MOVE IT!
  html.clearHTMLContent(stage)

  for(let num = 0; num < maxGems; num++)
    stage.appendChild(generateOptions(num+1))
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
