
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


local f = io.open("input_gtnh.txt")
--Materials(int aMetaItemSubID, TextureSet aIconSet, float aToolSpeed, int aDurability, int aToolQuality, boolean aUnificatable, String aName, String aDefaultLocalName
local output = {}
for line in f:lines() do
	local matName, toolSpeed, toolDurability, toolQuality, displayName = 
		string.match(line,"^%s*public static Materials (%w+)%s*= new Materials%([%s%d]+,[%s%w%._]+,%s*([%d%.F?]+)%s*,%s*(%d+)%s*,%s*(%d+)%s*,[^\"]+\"[^\"]+\"%s*,%s*\"([^\"]+)\"%s*,")
	
	if matName then
		toolSpeed = string.gsub(toolSpeed,"F","")
		output[#output+1] = {
			material = displayName,
			speed = tonumber(toolSpeed),
			durability = tonumber(toolDurability),
			tier = tonumber(toolQuality)
		}
	end
end

f:close()
local f = io.open("output.json","w")
local json = getJson(output)
--print(json)
f:write(json)
f:close()