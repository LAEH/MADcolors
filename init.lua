#!/usr/bin/env th

--●●●●●●●●●●●●●●●
--●             ●
--●             ●
--●             ●
--●             ●
--●             ●
--●             ●
--●●●●●●●●●●●●●●●

local MADcolors = {}
local MADpalettes = require 'MADcolors.palettes'

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
--●                                 ●
--●                    MUNSELL KEYS ●
--●                                 ●
--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●

--code    | RR-YR-YY-GY-GG-BG-BB-PB-PP-RP
--step    | 1-4
--value   | 1-9
--chroma  | 1-100
-- local munsellHueCodes = MADpalettes.munsell.codes
-- local nCode = #munsellHueCodes
-- function MADcolors.munsell (opt)
--    opt = opt or {}
--    local code = opt.code or munsellHueCodes[torch.random(1,8)]
--    local value = opt.value or torch.random(1,9)
--    local chroma = opt.chroma or torch.random(1,100)
--    local row = MADpalettes.munsell[code][step][value]
--    local nChroma = #row
--    local idx = math.ceil((chroma/100)*nChroma)
--    return row[idx]
-- end
-- print('function MADcolors.munsell.circular() = '..MADcolors.munsell())

--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
--●                                 ●
--●                  MUNSELL RADIAL ●
--●                                 ●
--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●

function MADcolors.circular(opt)
   opt = opt or {}
   local n  = 40
   local value = opt.value or torch.random(1,9)
   local chroma = opt.chroma or torch.random(1,99)
   local degree = opt.degree or torch.random(1,40)
   local goLeft = opt.goLeft or torch.random(1,20)
   local goRight = opt.goRight or torch.random(1,20)

   -- Get to hue non rectangular 2d matrix
   local idx = degree
   if goRight~=0 then idx = idx + goRight end
   if goLeft~=0 then idx = idx - goLeft end

   -- Circular Hue trick
   if idx > n then idx = idx - n end
   if idx < 0 then idx = n - idx end

   print(#MADpalettes.munsell.flat)
   -- Access value level row
   value = 10 - value
   local valueRow = MADpalettes.munsell.flat[idx][value]

   -- Choose color by chroma
   local nChroma = #valueRow
   local chromaIndex = math.ceil((chroma/100)*nChroma)
   return valueRow[chromaIndex]
end
print('function MADcolors.circular() = '..MADcolors.circular())


--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
--●                                 ●
--●       :                   OTHER ●
--●                                 ●
--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●


local darkBlues = {'#24273b','#1f2137','#191b31','#000024'}

--  Sample uniformely in color lisst
function MADcolors.rdm(colorList)
   local colorList = colorList or darkBlues
   local array = colorList
   for i = 1, #array-1 do
      local  j = torch.random(i,#array)
      array[i], array[j] = array[j], array[i]
   end
   return array[1]
end
print('function MADcolors.rdm() = '..MADcolors.rdm())

--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
return MADcolors



