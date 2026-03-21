export const teatroMunicipalManifest = {
  "venueId": "teatro-municipal",
  "geometryPath": "/maps/teatro-municipal-geometry.json",
  "hallName": "Theatro Municipal de Sao Paulo",
  "stageLabel": "Palco",
  "sections": [
    {
      "id": "setor-1",
      "name": "Setor 1",
      "shortLabel": "Setor 1",
      "price": 280,
      "tone": "orange",
      "description": "Foyer | Balcão Nobre | Plateia | Plateia - Obeso | Plateia - Cadeirante | Plateia - Mobilidade Reduzida | Plateia - Baixa Visão"
    },
    {
      "id": "setor-1-visao-parcial",
      "name": "Setor 1 - Visão parcial",
      "shortLabel": "Setor 1 - Visão parcial",
      "price": 180,
      "tone": "slate",
      "description": "Balcão Nobre | Frisa"
    },
    {
      "id": "setor-2",
      "name": "Setor 2",
      "shortLabel": "Setor 2",
      "price": 220,
      "tone": "slate",
      "description": "Balcão Simples | Foyer | Foyer - Mobilidade Reduzida | Foyer - Obeso"
    },
    {
      "id": "setor-2-visao-parcial",
      "name": "Setor 2 - Visão parcial",
      "shortLabel": "Setor 2 - Visão parcial",
      "price": 180,
      "tone": "slate",
      "description": "Balcão Nobre | Balcão Nobre - Obeso | Frisa | Frisa - Obeso"
    },
    {
      "id": "setor-2-vpp-vpl",
      "name": "Setor 2 - VPP / VPL",
      "shortLabel": "Setor 2 - VPP / VPL",
      "price": 180,
      "tone": "slate",
      "description": "Foyer"
    },
    {
      "id": "setor-3",
      "name": "Setor 3",
      "shortLabel": "Setor 3",
      "price": 160,
      "tone": "emerald",
      "description": "Anfiteatro | Galeria | Galeria - Visão Prejudicada | Balcão Simples | Balcão Simples  - Obeso | Balcão Simples - Visão Prejudicada | Foyer"
    },
    {
      "id": "setor-3-visao-parcial",
      "name": "Setor 3 - Visão parcial",
      "shortLabel": "Setor 3 - Visão parcial",
      "price": 180,
      "tone": "slate",
      "description": "Anfiteatro | Galeria | Galeria - Obeso | Balcão Simples | Foyer"
    },
    {
      "id": "tm",
      "name": "TM",
      "shortLabel": "TM",
      "price": 180,
      "tone": "slate",
      "description": "P. E."
    },
    {
      "id": "vip",
      "name": "VIP",
      "shortLabel": "VIP",
      "price": 180,
      "tone": "slate",
      "description": "Camarote"
    }
  ],
  "notes": [
    "Mapa importado da fonte vetorial oficial com 1531 assentos clicaveis.",
    "Os paths dos assentos foram preservados, e o fundo da sala vem do proprio SVG oficial sem os hotspots embutidos.",
    "Setores e areas comerciais foram lidos do data-tooltip, o que permite reajustar regras de preco sem refazer a geometria."
  ],
  "variant": "theater",
  "viewport": {
    "width": 2400,
    "height": 2000
  },
  "totalSeats": 1531,
  "availableSeats": 90,
  "sectionStats": {
    "setor-1": {
      "total": 674,
      "selectable": 2
    },
    "setor-1-visao-parcial": {
      "total": 57,
      "selectable": 0
    },
    "setor-2": {
      "total": 100,
      "selectable": 1
    },
    "setor-2-visao-parcial": {
      "total": 93,
      "selectable": 2
    },
    "setor-2-vpp-vpl": {
      "total": 3,
      "selectable": 0
    },
    "setor-3": {
      "total": 362,
      "selectable": 21
    },
    "setor-3-visao-parcial": {
      "total": 191,
      "selectable": 64
    },
    "tm": {
      "total": 1,
      "selectable": 0
    },
    "vip": {
      "total": 50,
      "selectable": 0
    }
  }
} as const;
