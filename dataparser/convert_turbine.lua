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

local f = io.open("input_turbine.txt")

local output = {}
for line in f:lines() do
	local material,
			small_dur, small_eff, small_flow,
			med_dur, med_eff, med_flow,
			large_dur, large_eff, large_flow,
			huge_dur, huge_eff, huge_flow
		= string.match( line, "^(.*)\t(%d+)\t(%d+)\t(%d+)\t(%d+)\t(%d+)\t(%d+)\t(%d+)\t(%d+)\t(%d+)\t(%d+)\t(%d+)\t(%d+)$" )

	if material then
		output[#output+1] = {
			material = material,
			small = {
				durability = small_dur,
				efficiency = small_eff,
				flow = small_flow
			},
			medium = {
				durability = med_dur,
				efficiency = med_eff,
				flow = med_flow
			},
			large = {
				durability = large_dur,
				efficiency = large_eff,
				flow = large_flow
			},
			huge = {
				durability = huge_dur,
				efficiency = huge_eff,
				flow = huge_flow
			}
		}
	else
		print("unable to parse line",line)
	end
end

--PrintTable(output)

f:close()
local f = io.open("output.json","w")
local json = getJson(output)
--print(json)
f:write(json)
f:close()
