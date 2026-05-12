// Smart engineering calculators with industry standard formulas

export const calculators = {
  floor: {
    name: 'Floor (Tiles/Marble/Parquet)',
    inputs: ['length', 'width', 'tileSize', 'wastage'],
    calculate: ({ length, width, tileSize = 0.6, wastage = 10 }) => {
      const area = length * width
      const tileArea = tileSize * tileSize
      const tiles = Math.ceil((area / tileArea) * (1 + wastage / 100))
      return {
        area: area.toFixed(2),
        tiles,
        unit: 'm²',
        items: [
          { description: `Floor tiles ${tileSize}x${tileSize}m`, qty: tiles, unit: 'pcs' },
          { description: 'Cement adhesive', qty: (area * 5).toFixed(1), unit: 'kg' },
          { description: 'Grout', qty: (area * 0.5).toFixed(1), unit: 'kg' },
        ]
      }
    }
  },
  wall: {
    name: 'Wall (Paint/Plaster/Blocks)',
    inputs: ['length', 'height', 'openings', 'coats'],
    calculate: ({ length, height, openings = 0, coats = 2 }) => {
      const gross = length * height
      const net = Math.max(0, gross - openings)
      const paintLiters = (net * coats * 0.12).toFixed(2)
      const plasterKg = (net * 20).toFixed(0)
      const blocks = Math.ceil(net * 12.5)
      return {
        area: net.toFixed(2),
        unit: 'm²',
        items: [
          { description: `Paint (${coats} coats)`, qty: paintLiters, unit: 'L' },
          { description: 'Plaster mix', qty: plasterKg, unit: 'kg' },
          { description: 'Concrete blocks 20x20x40', qty: blocks, unit: 'pcs' },
        ]
      }
    }
  },
  ceiling: {
    name: 'Ceiling (Gypsum/Suspended/Paint)',
    inputs: ['length', 'width'],
    calculate: ({ length, width }) => {
      const area = length * width
      return {
        area: area.toFixed(2),
        unit: 'm²',
        items: [
          { description: 'Gypsum board 12mm', qty: Math.ceil(area / 2.88), unit: 'sheets' },
          { description: 'Metal framing', qty: (area * 3.5).toFixed(1), unit: 'm' },
          { description: 'Ceiling paint', qty: (area * 0.15).toFixed(2), unit: 'L' },
        ]
      }
    }
  },
  concrete: {
    name: 'Concrete (Slab/Column/Beam)',
    inputs: ['length', 'width', 'thickness'],
    calculate: ({ length, width, thickness }) => {
      const volume = length * width * (thickness / 100)
      const cement = (volume * 350).toFixed(0)
      const sand = (volume * 0.45).toFixed(2)
      const aggregate = (volume * 0.9).toFixed(2)
      const water = (volume * 175).toFixed(0)
      return {
        volume: volume.toFixed(2),
        unit: 'm³',
        items: [
          { description: 'Cement (OPC)', qty: cement, unit: 'kg' },
          { description: 'Sand', qty: sand, unit: 'm³' },
          { description: 'Coarse aggregate', qty: aggregate, unit: 'm³' },
          { description: 'Water', qty: water, unit: 'L' },
        ]
      }
    }
  },
  steel: {
    name: 'Steel Reinforcement',
    inputs: ['volume', 'ratio'],
    calculate: ({ volume, ratio = 100 }) => {
      const steelKg = (volume * ratio).toFixed(1)
      return {
        weight: steelKg,
        unit: 'kg',
        items: [
          { description: 'Rebar Ø12mm', qty: (steelKg * 0.4).toFixed(1), unit: 'kg' },
          { description: 'Rebar Ø16mm', qty: (steelKg * 0.4).toFixed(1), unit: 'kg' },
          { description: 'Stirrups Ø8mm', qty: (steelKg * 0.2).toFixed(1), unit: 'kg' },
          { description: 'Binding wire', qty: (steelKg * 0.01).toFixed(2), unit: 'kg' },
        ]
      }
    }
  },
}
