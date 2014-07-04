#!/usr/bin/env th
local MADcolors = {}
--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
--●                                 ●
--●                             ENV ●
--●                                 ●
--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
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

function MADcolors.munsell (step,code,value,chroma)
   local value = 10 - value
   local row = MADpalettes.munsell[code][step][value]
   local nChroma = #row
   local idx = math.ceil((chroma/100)*nChroma)
   local hex = row[idx]
   local string = step..code..'v='..value..'c='..idx..'/'..nChroma..'('..chroma..'/100)'..'-'..hex
   print(string)
   return hex
end
MADcolors.munsell(1,'YR',2,50)

--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
--●                                 ●
--●                  MUNSELL RADIAL ●
--●                                 ●
--●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●

function MADcolors.circular(opt)
   opt = opt or {}
   local n  = #(MADpalettes.munsell.flat) -- n colors
   local value = opt.value or math.ceil(torch.uniform(1,9))
   local chroma = opt.chroma or math.ceil(torch.uniform(1,100))
   local degree = opt.degree or math.ceil(torch.uniform(1,40))
   local goLeft = opt.goLeft or math.ceil(torch.uniform(1,20))
   local goRight = opt.goRight or math.ceil(torch.uniform(1,20))

   -- Get to hue non rectangular 2d matrix
   local idx = degree
   if goRight~=0 then idx = idx + goRight end
   if goLeft~=0 then idx = idx - goLeft end

   -- Circular Hue trick
   if idx > n then idx = idx - n end
   if idx < 0 then idx = n - idx end

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
   for i = 1, #array do
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



