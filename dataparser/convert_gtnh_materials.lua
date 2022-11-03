
local function getJson( t, indent, done )
	local firstcall = (indent == nil and done == nil)
	done = done or {}
	indent = indent or 0

	local sequential = true
	local idx = 0
	local str = {}

	local indent_str = string.rep("\t",indent)
	for key,value in pairs( t ) do
		idx = idx + 1
		if key ~= idx then sequential = false end
		if type(value) == "string" and tonumber(value) ~= nil then value = tonumber(value) end
		if type(value) == "string" then value = "\"" .. value .. "\"" end

		if not sequential then
			key = "\"" .. key .. "\":"
		else
			key = ""
		end

		if type(value) == "table" and not done[ value ] then
			done[ value ] = true
			local seq, s = getJson( value, indent + 1, done )
			if seq then
				str[#str+1] = indent_str .. key .. "["
			else
				str[#str+1] = indent_str .. key .. "{"
			end
			str[#str+1] = (string.sub(s,-1) == "," and string.sub(s,1,-2) or s)
			if seq then
				str[#str+1] = indent_str .. "],"
			else
				str[#str+1] = indent_str .. "},"
			end
		else
			if sequential then
				str[#str+1] = indent_str .. value .. ","
			else
				str[#str+1] = indent_str .. key .. value .. ","
			end
		end
	end

	if not firstcall then
		return sequential, table.concat(str,"\n")
	else
		if sequential then
			return "[\n"..string.sub(table.concat(str,"\n"),1,-2).."\n]"
		else
			return "{\n"..string.sub(table.concat(str,"\n"),1,-2).."\n}"
		end
	end
end


local f = io.open("input_gtnh_2.2.0.0.txt")
--[[
Materials(
	int aMetaItemSubID,
	TextureSet aIconSet,
	float aToolSpeed,
	int aDurability,
	int aToolQuality,
	int aTypes,
	int aR,
	int aG,
	int aB,
	int aA,
	String aName,
	String aDefaultLocalName,
	int aFuelType,
	int aFuelPower,
	int aMeltingPoint,
	int aBlastFurnaceTemp,
	boolean aBlastFurnaceRequired,
	boolean aTransparent,
	int aOreValue,
	int aDensityMultiplier,
	int aDensityDivider,
	Dyes aColor,
	Element aElement,
	List<TC_Aspects.TC_AspectStack> aAspects
);

file: 
https://github.com/GTNewHorizons/GT5-Unofficial/blob/master/src/main/java/gregtech/api/enums/Materials.java

-- parse old 3qf data
			--string.match(line,"^%s*public static Materials (%w+)%s*= new Materials%([%s%d]+,[%s%w%._]+,%s*([%d%.F?]+)%s*,%s*(%d+)%s*,%s*(%d+)%s*,[^\"]+\"[^\"]+\"%s*,%s*\"([^\"]+)\"%s*,")

]]

local skipInt = "[%s%d]+"
local skipText = "[%s%w%._\"%(%)]+"
local skipTextureSet = "%s*new TextureSet%(\"[%s%w]+\", %w+%)"
local skipFloat = "[%s%d%.F]+"
local skipFlag = "[%s%d|]+"
local parseFloat = "%s*([%d%.F?]+)%s*"
local parseInt = "%s*([%*%d%s]+)%s*"
local parseString = "%s*\"([^\"]+)\"%s*"
local getRemainder = ".*"

local parser = "public static Materials (%w+)%s*= new Materials%(" .. string.format("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s",--
	skipInt, -- int aMetaItemSubID,
	skipText, -- TextureSet aIconSet,
	parseFloat, -- float aToolSpeed,
	parseInt, -- int aDurability,
	parseInt, -- int aToolQuality,
	skipFlag, -- int aTypes,
	skipInt, -- int aR,
	skipInt, -- int aG,
	skipInt, -- int aB,
	skipInt, -- int aA,
	skipText, -- String aName,
	parseString, -- String aDefaultLocalName,
	getRemainder
) .. "%);$"
local parseTextureSet = "public static Materials (%w+)%s*= new Materials%(" .. string.format("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s",--
	skipInt, -- int aMetaItemSubID,
	skipTextureSet, -- TextureSet aIconSet,
	parseFloat, -- float aToolSpeed,
	parseInt, -- int aDurability,
	parseInt, -- int aToolQuality,
	skipFlag, -- int aTypes,
	skipInt, -- int aR,
	skipInt, -- int aG,
	skipInt, -- int aB,
	skipInt, -- int aA,
	skipText, -- String aName,
	parseString, -- String aDefaultLocalName,
	getRemainder
) .. "%);$"
local parseTurbineMultipliers = ".setTurbineMultipliers%("..parseInt..","..parseInt..","..parseInt.."%)"

local parsers = {
	parser, parseTextureSet
}

local function parseMath(str)
	if str:match("[^%d]") then
		return loadstring("return " .. str)()
	else
		return tonumber(str)
	end
end

--[[
local str = [==[public static Materials SpaceTime = new Materials(             588,             new TextureSet("spacetime", true),             320.0F,             4 * 2621440,             25,             1 | 2 | 64 | 128,             255,             255,             255,             0,             "SpaceTime",             "SpaceTime",             -1,             -1,             0,             0,             false,             true,             2,             1,             1,             Dyes._NULL,             Collections.singletonList(new TC_AspectStack(TC_Aspects.AQUA, 1)));]==]
print("parser",parseTextureSet)
print("line",str)
print(string.match(str,parseTextureSet))
local a,b,c = string.match(str,parseTextureSet)
print("parseMath",parseMath(c))

if true then return end
]]

local output = {}
local tempstr = {}


local function doThing(line, matName, toolSpeed, toolDurability, toolQuality, displayName)
	if toolSpeed and toolDurability and toolQuality then
		toolSpeed = string.gsub(toolSpeed,"F","")
		toolSpeed = tonumber(toolSpeed)
		toolDurability = parseMath(toolDurability)
		toolQuality = tonumber(toolQuality)
		if toolSpeed > 0 and toolDurability > 0 then
			local item = {
				material = displayName,
				speed = toolSpeed,
				durability = toolDurability,
				tier = toolQuality,
			}

			local steamM, gasM, plasmaM = string.match(line, parseTurbineMultipliers)
			if steamM and gasM and plasmaM then
				steamM = tonumber(steamM)
				gasM = tonumber(gasM)
				plasmaM = tonumber(plasmaM)
				if steamM and gasM and plasmaM then
					item.turbine_multipliers = {
						steam = steamM,
						gas = gasM,
						plasma = plasmaM
					}
				end
			end

			output[#output+1] = item
		end
	end
end

for line in f:lines() do
	if line:find(";") then
		tempstr[#tempstr+1] = line
		line = table.concat(tempstr," ")
		tempstr = {}
		local parsed = false
		for i=1,#parsers do
			local matName, toolSpeed, toolDurability, toolQuality, displayName = string.match(line,parsers[i])
			--print(line)
			--print(matName,toolSpeed,toolDurability,toolQuality,displayName)
			--print("---")
			
			if matName then
				doThing(line, matName, toolSpeed, toolDurability, toolQuality, displayName)
				parsed = true
			end
		end
		if parsed == false then	
			if string.match(line,"public static Materials %w+ = new Materials%(") then
				print("unable to parse material line")
				print(line)
				print("---")
			end
		end
	else
		tempstr[#tempstr+1] = line
	end
end

output[#output+1] = {
	speed = 225,
	material = "Extremely Unsable Naquadah",
	durability = 31500,
	tier = 25
}

f:close()
local f = io.open("output.json","w")
local json = getJson(output)
--print(json)
f:write(json)
f:close()