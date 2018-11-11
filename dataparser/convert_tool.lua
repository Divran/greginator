-- Inspired by Gmod's source code
local function PrintTable( t, indent, done )
	done = done or {}
	indent = indent or 0

	local indent_str = string.rep("\t",indent)
	for key,value in pairs( t ) do
		if  type(value) == "table" and not done[ value ] then
			done[ value ] = true
			print( indent_str .. tostring( key ) .. ":" )
			PrintTable( value, indent + 1, done )
		else
			print( indent_str .. tostring( key ) .. "\t=\t" .. tostring( value ) )
		end
	end
end

-- Borrowed from Gmod source code
local string_sub = string.sub
local string_find = string.find
local string_len = string.len
function string.Explode(separator, str, withpattern)
	if ( withpattern == nil ) then withpattern = false end

	local ret = {}
	local current_pos = 1

	for i = 1, string_len( str ) do
		local start_pos, end_pos = string_find( str, separator, current_pos, not withpattern )
		if ( not start_pos ) then break end
		ret[ i ] = string_sub( str, current_pos, start_pos - 1 )
		current_pos = end_pos + 1
	end

	ret[ #ret + 1 ] = string_sub( str, current_pos )

	return ret
end

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

local f = io.open("input_tool.txt")

local output = {}
local tier = 0
local soft_materials = {
	polysiloxane = true,
	wood = true,
	polyethylene = true,
	rubber = true,
	ironwood = true,
	["iron wood"] = true,
	steeleaf = true,
	["steel leaf"] = true
}
local unsupported_mods = {
	["Not obtainable"] = true,
	RotaryCraft = true,
	DartCraft = true,
	["Twilight Forest"] = true,
	["Ars Magica 2"] = true,
	["Metallurgy 4"] = true
}


for line in f:lines() do
	if string.find(line,"\t") then
		local values = string.Explode("\t",line)

		-- filter out unsupported mods
		-- (NOTE: adamantium is an exception, so manually erase the mod from the input file for adamantium!!)
		if values[5] == nil or not unsupported_mods[values[5]] then
			local tool = {
				material = values[1],
				durability = values[2],
				speed = values[3],
				enchant = values[4] or "",
				othermod = values[5] or "",
				tier = tier
			}

			tool.soft = soft_materials[string.lower(tool.material)] and 1 or 0

			output[#output+1] = tool
		end
	else
		tier = tier + 1
	end
end

PrintTable(output)

f:close()
local f = io.open("output.json","w")
local json = getJson(output)
--print(json)
f:write(json)
f:close()
