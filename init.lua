#!/usr/bin/env th
local MADpalettes = require 'palettes'
local col = require 'async.repl'.colorize
function h1(text) print(col._black(text)) end
function h2(text) print(col.red(text)) end
function h3(text) print(col._cyan(text)) end
local MADcolors = {
   munsell = {}
}


--●●●●●●●●●●●●●●●●
--●              ●
--●              ●
--●              ●
--●              ●
--●              ●
--●              ●
--●              ●
--●●●●●●●●●●●●●●●●

function MADcolors.rdm(colorList)
   local colorList = colorList or MADpalettes.coolhex
   local array = colorList
   for i = 1, #array-1 do
      local  j = torch.random(i,#array)
      array[i], array[j] = array[j], array[i]
   end
   return array[1]
end
print('function MADcolors.rdm() = '..MADcolors.rdm())

--●●●●●●●●●●●●●●●●
--●              ●
--●              ●
--●              ●
--●              ●
--●              ●
--●              ●
--●              ●
--●●●●●●●●●●●●●●●●

function MADpalettes.hsla(h,s,l,a)
    local a = a or 1;
    return 'hsla(' .. h .. ',' .. s .. '%,' .. l .. '%,' .. a .. ')'
end
print('function MADpalettes.hsla (h,s,l,a) = '..MADpalettes.hsla (180,50,50,1))


--●●●●●●●●●●●●●●●●
--●              ●
--●              ●
--●              ●
--●              ●
--●              ●
--●              ●
--●              ●
--●●●●●●●●●●●●●●●●

function MADcolors.munsell.byCode(opt)

   ---- PALETTE
   local codes = MADpalettes.munsell.codes
   local RDMcode = codes[torch.random(1,#codes)]
   local setPalette  = MADpalettes.munsell.bycode

   ---- OPTIONS
   opt = opt or {}
   local code = opt.code or RDMcode
   local step = opt.step or 4
   local value = opt.value or 9
   local chroma = opt.value or 50

   ---- GET
   local setHue = setPalette[code]
   local setStep = setHue[4]
   local setValue = setStep[9]
   local nChroma = #setValue
   local chromaIndex = math.ceil((chroma/100) * nChroma)
   local color = setValue[chromaIndex]

   ---- PRINT
   h1([[
      ------------------------
      MADcolors.munsell.byCode ({
         Value  =]].. step   ..[[,  (1-9)
         Chroma =]].. code  ..[[,  (R-YR-Y-GY-G-BG-B-PB-P-RP)
         degree =]].. value  ..[[,  (1-40)
         rLeft  =]].. chroma  ..[[,  (1-100)
      })
      index Chroma = ]]..chromaIndex..[[/]]..nChroma..[[
      hex = ]]..color
   )

   ---- RETURN
   return color
end

MADcolors.munsell.byCode({
   code = 'R',
   step = 4,
   value = 9,
   chroma = 100
})

--●●●●●●●●●●●●●●●●
--●              ●
--●              ●
--●              ●
--●              ●
--●              ●
--●              ●
--●              ●
--●●●●●●●●●●●●●●●●

function MADcolors.circular(opt)
   opt = opt or {}
   local n  = 40
   local value = opt.value or torch.random(1,9)
   local chroma = opt.chroma or torch.random(1,99)
   local degree = opt.degree or torch.random(1,40)
   local goLeft = opt.goLeft or torch.random(1,20)
   local goRight = opt.goRight or torch.random(1,20)

   ----hue
   local idx = degree
   if goRight~=0 then idx = idx + goRight end
   if goLeft~=0 then idx = idx - goLeft end

   ----list -> circle
   if idx > n then idx = idx - n end
   if idx < 0 then idx = n - idx end

   ----light row
   value = 10 - value
   local valueRow = MADpalettes.munsell.flat[idx][value]

   ----color
   local nChroma = #valueRow
   local chromaIndex = math.ceil((chroma/100)*nChroma)
   local color = valueRow[chromaIndex]

   h1([[
      ------------------
      MADcolors.circular ({
         Value  =]].. value   ..[[,  (1-9)
         Chroma =]].. chroma  ..[[,  (1-100)
         degree =]].. degree  ..[[,  (1-40)
         rLeft  =]].. goLeft  ..[[,  (1-20)
         rRight =]].. goRight ..[[,  (1-20)
      })
      COLOR = ]]..color..[[
   ]]
   )

   ---- RETURN
   return color

end
MADcolors.circular()

--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
--●                                 ●
--●                             ENV ●
--●                                 ●
--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●

function MADcolors.hex2rgb(hexString)
   _,_,R,G,B = hexString:find('.(..)(..)(..)')
   R = tonumber('0x'..R)/255
   G = tonumber('0x'..G)/255
   B = tonumber('0x'..B)/255
end

--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
return MADcolors



