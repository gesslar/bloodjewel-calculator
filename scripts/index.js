import gems from "./gems.js"
import Calc from "./calc.js"

import * as TK from "https://esm.sh/@gesslar/toolkit"

const html = TK.HTML
const disposer = TK.Disposer
const gemDisposer = new TK.DisposerClass()
const notify = TK.Notify
const calc = Calc

let maxGems = 12
const dialogDisposer = new TK.DisposerClass()
let activeDialog = null
let lastTrigger = null

disposer.register(notify.on("DOMContentLoaded", () => {
  const showPasteStageButton = document.querySelector("#showPasteStage")
  const resetGemsButton = document.querySelector("#resetGems")

  disposer.register(
    notify.on("click", evt => showPasteStage(evt), showPasteStageButton),
    notify.on("click", evt => calc.resetGems(evt), resetGemsButton),
  )

  createTable()
}, document))

function showPasteStage() {
  if(activeDialog)
    return

  lastTrigger = document.activeElement

  const template = document.querySelector("#pasteDialogTemplate")
  const fragment = template.content.cloneNode(true)
  const pasteDialog = fragment.querySelector("#pasteDialog")
  const pasteBox = fragment.querySelector("#pasteBox")
  const pasteButton = fragment.querySelector("#pasteButton")
  const cancelPasteButton = fragment.querySelector("#cancelpaste")

  const handleTrap = event => {
    if(event.key !== "Tab")
      return

    const focusables = pasteDialog.querySelectorAll(
      "button, textarea, [href], input, select, [tabindex]:not([tabindex='-1'])"
    )
    const focusArray = Array.from(focusables)
      .filter(el => !el.disabled && el.tabIndex !== -1)

    if(focusArray.length === 0)
      return

    const first = focusArray[0]
    const last = focusArray[focusArray.length - 1]

    if(event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if(!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  dialogDisposer.dispose()

  dialogDisposer.register(
    notify.on("click", () => paste(pasteDialog, pasteBox), pasteButton),
    notify.on("click", () => hidePasteStage(pasteDialog, pasteBox), cancelPasteButton),
    notify.on("cancel", event => {
      event.preventDefault()
      hidePasteStage(pasteDialog, pasteBox)
    }, pasteDialog),
    notify.on("close", () => cleanupDialog(pasteDialog), pasteDialog),
    notify.on("keydown", handleTrap, pasteDialog)
  )

  document.body.appendChild(pasteDialog)
  activeDialog = pasteDialog

  pasteDialog.showModal()
  requestAnimationFrame(() => pasteDialog.classList.add("is-open"))
  pasteBox.focus()
}

function hidePasteStage(pasteDialog, pasteBox) {
  pasteBox.blur()
  pasteDialog.classList.remove("is-open")

  const finishClose = () => {
    pasteDialog.removeEventListener("transitionend", finishClose)
    if(pasteDialog.open)
      pasteDialog.close()
  }

  pasteDialog.addEventListener("transitionend", finishClose)
  setTimeout(finishClose, 250) // Fallback in case transitionend doesn't fire
}

function cleanupDialog(pasteDialog) {
  dialogDisposer.dispose()
  pasteDialog.remove()
  activeDialog = null
  if(lastTrigger instanceof HTMLElement)
    lastTrigger.focus()
}

function paste(pasteDialog, pasteBox) {
  const debugStage = document.querySelector("#debugStage")
  const lines = pasteBox.value.split("\n")

  pasteBox.value = ""  // Clear the textarea

  hidePasteStage(pasteDialog, pasteBox)

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
    element.setAttribute("aria-label", `Bloodjewel ${num} ${select}`)

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
