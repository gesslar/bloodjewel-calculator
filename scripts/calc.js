import gems from "./gems.js"

export default new class Calc {
  #selectedGems = []
  #effects = {}

  get output() {
    return document.querySelector("#outputStage")
  }

  get debug() {
    return document.querySelector("#debugStage")
  }

  get selects() {
    return document.querySelectorAll("#selects")
  }

  #cooldown = false

  gemUpdated() {
    if(this.#cooldown)
      return

    this.#cooldown = true

    setTimeout(() => {
      this.#cooldown = false
      this.output.innerHTML = ""
      this.debug.innerHTML = ""

      this.buildSelectedGems()
      this.generateEffects()
      this.floorValues()
      this.printEffects()

    }, 50)
  }

  resetGems() {
    this.#selectedGems.length = 0
    this.#effects = {}

    // iterate through all of the selects and reset them to the first option
    for(const select of selects) {
      select.selectedIndex = 0
    }

    gemUpdated()
  }

  buildSelectedGems() {
    const selects = document.getElementsByTagName("select") // Ensure you fetch the current state of selects
    const numPairs = selects.length / 2 // Assuming each group has exactly two selects

    this.#selectedGems.length = 0 // Reset selectedGems

    for(let i = 0; i < numPairs; i++) {
      const qualitySelect = selects[i * 2] // Quality is assumed to be the first in each pair
      const typeSelect = selects[i * 2 + 1] // Type is assumed to be the second

      const gemQuality = qualitySelect.value
      const gemType = typeSelect.value

      // Validate the selections
      const {qualities,types} = gems
      if(types.indexOf(gemType) === -1 || qualities.indexOf(gemQuality) === -1)
        continue

      this.#selectedGems.push({
        type: gemType,
        quality: qualities.indexOf(gemQuality)
      })
    }
  }

  generateEffects() {
    this.#effects = {}
    const allBonuses = {}

    // First, gather all bonuses for each type
    this.#selectedGems.forEach(gem => {
      const {type, quality} = gem
      const bonuses = gems.gems[type]

      bonuses.forEach(bonus => {
        const {title, values, name, notation} = bonus
        if(!allBonuses[title]) {
          allBonuses[title] = {
            values: [],
            name: name, // Capture the name here
            notation: notation || "" // Capture the notation here
          }
        }

        allBonuses[title].values.push(values[quality])
      })
    })

    // Now process each type of bonus with diminishing returns
    Object.keys(allBonuses).forEach(title => {
      const values = allBonuses[title].values
      if(values.length === 0)
        return

      // Sort values from highest to lowest
      values.sort((a, b) => Math.abs(b) - Math.abs(a))

      const mainValue = values[0] // The highest value, no diminishing returns applied
      let totalValue = mainValue

      if(values.length > 1) {
      // Apply diminishing returns to the sum of the remaining values
        const remainder = values.slice(1)
        const remainderSum = remainder.reduce((acc, val) => acc + val, 0)
        const diminishedSum = remainderSum / gems.diminishing_factor

        totalValue += diminishedSum
      }

      // Ensure we have initial setup for this effect in the main effects object
      if(!this.#effects[title]) {
        this.#effects[title] = {
          value: 0,
          name: allBonuses[title].name, // Set name from stored bonus data
          notation: allBonuses[title].notation // Set notation from stored bonus data
        }
      }

      this.#effects[title].value += totalValue
    })
  }

  floorValues() {
    for(const label in gems.effects) {
      effects[label].value = Math.floor(effects[label].value)
    }

  }

  printEffects() {
    const labels = Object.keys(this.#effects)

    labels.sort()

    for(const label of labels) {
      if(this.#effects[label].value === 0)
        continue

      this.output.innerHTML += `<div><span class="effect_label">${label}:</span> <span class="effect_value">${this.#effects[label].value}${this.#effects[label].notation}</span></div>`
    }
  }
}
