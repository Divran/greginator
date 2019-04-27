	
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

local foods = {}
local custom_food_values = {
	stock = 20,
	menril_berries = 70
}

function parseLine(line)
	local mod, name, heal, saturation = string.match(line,"^%- ([^:]+):([%w%s_%-:']+)%sHeal amount: (%d+) Saturation amount: ([%d%.]+)$")
	if not mod or not name or not heal or not saturation then
		print("unable to parse this line:",line)
	else
		heal = tonumber(heal)
		saturation = tonumber(saturation)
		foods[#foods+1] = {
			mod = mod,
			name = name,
			heal = heal,
			saturation = saturation,
			compost_amount = custom_food_values[name] or math.floor((20 + (30 * (heal + saturation)))/10)*10
		}
	end
end


local function doThing(f)
	local first = true
	for line in f do
		if first then
			first = false -- ignore the "Foods:" at the top
		else
			parseLine(line)
		end
	end

	table.sort(foods,function(a,b) return string.lower(a.name)<string.lower(b.name) end)
	print(getJson(foods))
	print("AMOUNT:",#foods)
end

local f = io.lines("input_food.txt")
doThing(f)