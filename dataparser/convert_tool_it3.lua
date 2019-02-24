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

local tools = {}
local soft_materials = {rubber=true,polyethylene=true,polytetrafluoroethylene=true}
local enchantments = {
    vinteum = "Fortune I",
    black_bronze = "Smite II",
    rose_gold = "Smite IV",
    invar = "Bane of Arthropods III",
    bismuth_bronze = "Bane of Arthropods V",
    iron = "Sharpness I",
    bronze = "Sharpness I",
    brass = "Sharpness II",
    steel = "Sharpness II",
    wrought_iron = "Sharpness II",
    stainless_steel = "Sharpness III",
    black_steel = "Sharpness IV",
    red_steel = "Sharpness IV",
    blue_steel = "Sharpness V",
    damascus_steel = "Sharpness V",
    tungsten_carbide = "Sharpness V",
    hsse = "Sharpness V",
    hssg = "Sharpness IV",
    hsss = "Sharpness V"
}
local function parseLine(line)
    if not string.find(line,"IngotMaterial") then return end
    local name, mining_tier, speed, durability = string.match(line,"^.*IngotMaterial%(%d+,%s\"([%w_]+)\",.-,.-,%s(%d+),.*,%s([%d%.]+)F,%s(%d+).*$")
    if not name or not mining_tier or not speed or not durability then return end

    local enchant = enchantments[name] or ""

    if name == "hsse" then name = "HSS-E"
    elseif name == "hssg" then name = "HSS-G"
    elseif name == "hsss" then name = "HSS-S"
    else
        name = string.gsub(name,"_"," ")
        name = string.upper(string.sub(name,1,1))..string.sub(name,2)
    end

    tools[#tools+1] = {
        soft = 0,
        speed = tonumber(speed),
        material = name,
        othermod = "",
        durability = tonumber(durability) * 10,
        tier = tonumber(mining_tier),
        enchant = enchant,
        age = 0
    }
end

local function doThing(str)
    for line in string.gmatch(str,"([^\n]+)") do parseLine(line) end

    print(getJson(tools))
end

--[[
local s = [==[public static IngotMaterial Aluminium = new IngotMaterial(1, "aluminium", 0x80C8F0, MaterialIconSet.DULL, 2, of(), EXT2_METAL | GENERATE_SMALL_GEAR | GENERATE_ORE | GENERATE_RING | GENERATE_FRAME, Element.Al, 10.0F, 128, 1700);]==]
print(string.match(s,"^.*IngotMaterial%(%d+,%s\"([%w_]+)\",.-,.-,%s(%d+),.*,%s([%d%.]+)F,%s(%d+).*$"))

local s = [==[val materialCompressedWroughtIron = MaterialRegistry.createIngotMaterial(700, "compressed_wrought_iron", 0xC8B4B4, "dull", 2, [<material:iron> * 1, <material:carbon> * 25], 7.0F, 460);]==]
    local name, mining_tier, speed, durability = string.match(s,"^.*IngotMaterial%(%d+,%s\"([%w_]+)\",.-,.-,%s(%d+),.*,%s([%d%.]+)F,%s(%d+).*$")
    print(name,mining_tier,speed,durability)
]]

local str = [[
    /** IT3 custom materials **/
    /* "F" was added after the floats to make the regex work */

    val materialCompressedWroughtIron = MaterialRegistry.createIngotMaterial(700, "compressed_wrought_iron", 0xC8B4B4, "dull", 2, [<material:iron> * 1, <material:carbon> * 25], 7.0F, 460);
    materialCompressedWroughtIron.addFlags(["GENERATE_PLATE", "GENERATE_ROD", "GENERATE_BOLT_SCREW"]);

    val materialCompressedIron = MaterialRegistry.createIngotMaterial(701, "compressed_iron", 0xC8D4D4, "dull", 2, [<material:iron> * 1], 6.0F, 435);
    materialCompressedIron.addFlags(["GENERATE_PLATE", "GENERATE_ROD", "GENERATE_BOLT_SCREW"]);

    val materialEnderium = MaterialRegistry.createIngotMaterial(702, "enderium", 0x2E574F, "shiny", 3, null, 8.0F, 256, 3000);
    materialEnderium.addFlags(["GENERATE_BOLT_SCREW", "GENERATE_GEAR"]);

    val materialSignalum = MaterialRegistry.createIngotMaterial(703, "signalum", 0xFFAA33, "shiny", 2, null, 5.0F, 128, 1000);
    materialSignalum.addFlags(["GENERATE_BOLT_SCREW", "GENERATE_GEAR"]);

    val materialThaumium = MaterialRegistry.createIngotMaterial(706, "thaumium", 0x7A007A, "shiny", 2, null, 7.6F, 740);
    materialThaumium.addFlags(["GENERATE_PLATE", "GENERATE_ROD", "GENERATE_BOLT_SCREW"]);


    /**
     * Direct Elements
     */
    public static IngotMaterial Aluminium = new IngotMaterial(1, "aluminium", 0x80C8F0, MaterialIconSet.DULL, 2, of(), EXT2_METAL | GENERATE_SMALL_GEAR | GENERATE_ORE | GENERATE_RING | GENERATE_FRAME, Element.Al, 10.0F, 128, 1700);
    public static IngotMaterial Americium = new IngotMaterial(2, "americium", 0xC8C8C8, MaterialIconSet.METALLIC, 3, of(), STD_METAL | GENERATE_ROD | GENERATE_LONG_ROD, Element.Am);
    public static IngotMaterial Antimony = new IngotMaterial(3, "antimony", 0xDCDCC8, MaterialIconSet.SHINY, 2, of(), EXT_METAL | MORTAR_GRINDABLE, Element.Sb);
    public static FluidMaterial Argon = new FluidMaterial(4, "argon", 0xBBBB00, MaterialIconSet.FLUID, of(), STATE_GAS | GENERATE_PLASMA, Element.Ar);
    public static DustMaterial Arsenic = new DustMaterial(5, "arsenic", 0xDDDDDD, MaterialIconSet.SAND, 2, of(), 0, Element.As);
    public static IngotMaterial Barium = new IngotMaterial(6, "barium", 0xFFFFFF, MaterialIconSet.SHINY, 2, of(), 0, Element.Ba);
    public static IngotMaterial Beryllium = new IngotMaterial(7, "beryllium", 0x64B464, MaterialIconSet.METALLIC, 2, of(), STD_METAL | GENERATE_ORE, Element.Be);
    public static IngotMaterial Bismuth = new IngotMaterial(8, "bismuth", 0x64A0A0, MaterialIconSet.METALLIC, 1, of(), GENERATE_ORE, Element.Bi);
    public static DustMaterial Boron = new DustMaterial(9, "boron", 0xD2F0D2, MaterialIconSet.SAND, 2, of(), 0, Element.B);
    public static IngotMaterial Caesium = new IngotMaterial(10, "caesium", 0xFFFFFC, MaterialIconSet.DULL, 2, of(), 0, Element.Cs);
    public static IngotMaterial Calcium = new IngotMaterial(11, "calcium", 0xDDDDAA, MaterialIconSet.METALLIC, 2, of(), 0, Element.Ca);
    public static IngotMaterial Carbon = new IngotMaterial(12, "carbon", 0x333333, MaterialIconSet.DULL, 2, of(), 0, Element.C);
    public static IngotMaterial Cadmium = new IngotMaterial(13, "cadmium", 0x505060, MaterialIconSet.SHINY, 2, of(), 0, Element.Cd);
    public static IngotMaterial Cerium = new IngotMaterial(14, "cerium", 0xEEEEEE, MaterialIconSet.METALLIC, 2, of(), 0, Element.Ce, 1068);
    public static FluidMaterial Chlorine = new FluidMaterial(15, "chlorine", 0xEEEECC, MaterialIconSet.GAS, of(), STATE_GAS, Element.Cl);
    public static IngotMaterial Chrome = new IngotMaterial(16, "chrome", 0xFFAAAB, MaterialIconSet.SHINY, 3, of(), EXT2_METAL | GENERATE_RING | GENERATE_ROTOR, Element.Cr, 12.0F, 512, 1700);
    public static IngotMaterial Cobalt = new IngotMaterial(17, "cobalt", 0x2929BC, MaterialIconSet.METALLIC, 3, of(),  GENERATE_ORE | STD_SOLID, Element.Co, 10.0F, 256);
    public static IngotMaterial Copper = new IngotMaterial(18, "copper", 0xFF8000, MaterialIconSet.SHINY, 1, of(), EXT2_METAL | GENERATE_ORE | MORTAR_GRINDABLE | GENERATE_DENSE, Element.Cu);
    public static FluidMaterial Deuterium = new FluidMaterial(19, "deuterium", 0xEEEE00, MaterialIconSet.FLUID, of(), STATE_GAS | GENERATE_PLASMA, Element.D);
    public static IngotMaterial Dysprosium = new IngotMaterial(20, "dysprosium", 0xFFFFEE, MaterialIconSet.SHINY, 2, of(), 0, Element.Dy, 1680);
    public static IngotMaterial Erbium = new IngotMaterial(21, "erbium", 0xEEEEEE, MaterialIconSet.METALLIC, 2, of(), STD_METAL, Element.Er, 1802);
    public static IngotMaterial Europium = new IngotMaterial(22, "europium", 0xFFFFFF, MaterialIconSet.METALLIC, 2, of(), STD_METAL | GENERATE_ROD, Element.Eu, 1099);
    public static FluidMaterial Fluorine = new FluidMaterial(23, "fluorine", 0xFFFFAA, MaterialIconSet.GAS, of(), STATE_GAS, Element.F);
    public static IngotMaterial Gadolinium = new IngotMaterial(24, "gadolinium", 0xDDDDFF, MaterialIconSet.METALLIC, 2, of(), 0, Element.Gd, 1585);
    public static IngotMaterial Gallium = new IngotMaterial(25, "gallium", 0xEEEEFF, MaterialIconSet.SHINY, 2, of(), GENERATE_PLATE, Element.Ga);
    public static IngotMaterial Gold = new IngotMaterial(26, "gold", 0xFFFF00, MaterialIconSet.SHINY, 2, of(), EXT2_METAL | GENERATE_ORE | MORTAR_GRINDABLE, Element.Au);
    public static IngotMaterial Holmium = new IngotMaterial(27, "holmium", 0xFFFFFF, MaterialIconSet.METALLIC, 2, of(), 0, Element.Ho, 1734);
    public static FluidMaterial Hydrogen = new FluidMaterial(28, "hydrogen", 0x00FFAA, MaterialIconSet.GAS, of(), STATE_GAS, Element.H);
    public static FluidMaterial Helium = new FluidMaterial(29, "helium", 0xDDDD00, MaterialIconSet.GAS, of(), STATE_GAS, Element.He);
    public static FluidMaterial Helium3 = new FluidMaterial(30, "helium3", 0xDDDD00, MaterialIconSet.GAS, of(), STATE_GAS, Element.He_3);
    public static IngotMaterial Indium = new IngotMaterial(31, "indium", 0x6600BB, MaterialIconSet.METALLIC, 2, of(), 0, Element.In);
    public static IngotMaterial Iridium = new IngotMaterial(32, "iridium", 0xFFFFFF, MaterialIconSet.DULL, 3, of(), GENERATE_ORE | EXT2_METAL | GENERATE_ORE | GENERATE_RING | GENERATE_ROTOR, Element.Ir, 7.0F, 2560, 2719);
    public static IngotMaterial Iron = new IngotMaterial(33, "iron", 0xAAAAAA, MaterialIconSet.METALLIC, 2, of(), EXT2_METAL | GENERATE_ORE | MORTAR_GRINDABLE | GENERATE_RING | GENERATE_DENSE | GENERATE_FRAME, Element.Fe, 7.0F, 256);
    public static IngotMaterial Lanthanum = new IngotMaterial(34, "lanthanum", 0xFFFFFF, MaterialIconSet.METALLIC, 2, of(), 0, Element.La, 1193);
    public static IngotMaterial Lead = new IngotMaterial(35, "lead", 0x8C648C, MaterialIconSet.DULL, 1, of(), EXT2_METAL | GENERATE_ORE | MORTAR_GRINDABLE | GENERATE_DENSE, Element.Pb);
    public static IngotMaterial Lithium = new IngotMaterial(36, "lithium", 0xCBCBCB, MaterialIconSet.DULL, 2, of(), STD_METAL | GENERATE_ORE, Element.Li);
    public static IngotMaterial Lutetium = new IngotMaterial(37, "lutetium", 0xFFFFFF, MaterialIconSet.METALLIC, 2, of(), 0, Element.Lu, 1925);
    public static IngotMaterial Magnesium = new IngotMaterial(38, "magnesium", 0xFFBBBB, MaterialIconSet.METALLIC, 2, of(), 0, Element.Mg);
    public static IngotMaterial Manganese = new IngotMaterial(39, "manganese", 0xEEEEEE, MaterialIconSet.DULL, 2, of(), 0, Element.Mn, 7.0F, 512);
    public static FluidMaterial Mercury = new FluidMaterial(40, "mercury", 0xFFDDDD, MaterialIconSet.FLUID, of(), SMELT_INTO_FLUID, Element.Hg);
    public static IngotMaterial Molybdenum = new IngotMaterial(41, "molybdenum", 0xAAAADD, MaterialIconSet.DULL, 2, of(), GENERATE_ORE, Element.Mo, 7.0F, 512, 2);
    public static IngotMaterial Neodymium = new IngotMaterial(42, "neodymium", 0x777777, MaterialIconSet.METALLIC, 2, of(), STD_METAL | GENERATE_ROD | GENERATE_ORE, Element.Nd, 7.0F, 512, 1297);
    public static IngotMaterial Darmstadtium = new IngotMaterial(43, "darmstadtium", 0xAAAAAA, MaterialIconSet.METALLIC, 6, of(), EXT2_METAL | GENERATE_RING | GENERATE_ROTOR | GENERATE_SMALL_GEAR | GENERATE_LONG_ROD | GENERATE_FRAME, Element.Ds, 24.0F, 155360);
    public static IngotMaterial Nickel = new IngotMaterial(44, "nickel", 0xAAAAFF, MaterialIconSet.METALLIC, 2, of(), STD_METAL | GENERATE_ORE | MORTAR_GRINDABLE, Element.Ni);
    public static IngotMaterial Niobium = new IngotMaterial(45, "niobium", 0x9486AA, MaterialIconSet.METALLIC, 2, of(), STD_METAL | GENERATE_ORE, Element.Nb, 2750);
    public static FluidMaterial Nitrogen = new FluidMaterial(46, "nitrogen", 0x7090AF, MaterialIconSet.FLUID, of(), STATE_GAS | GENERATE_PLASMA, Element.N);
    public static IngotMaterial Osmium = new IngotMaterial(47, "osmium", 0x5050FF, MaterialIconSet.METALLIC, 4, of(), GENERATE_ORE | EXT2_METAL | GENERATE_RING | GENERATE_ROTOR, Element.Os, 16.0F, 1280, 3306);
    public static FluidMaterial Oxygen = new FluidMaterial(48, "oxygen", 0x90AAEE, MaterialIconSet.FLUID, of(), STATE_GAS, Element.O);
    public static IngotMaterial Palladium = new IngotMaterial(49, "palladium", 0xCED0DD, MaterialIconSet.METALLIC, 2, of(), EXT2_METAL | GENERATE_ORE, Element.Pd, 8.0f, 512, 1228);
    public static DustMaterial Phosphorus = new DustMaterial(50, "phosphorus", 0xC8C800, MaterialIconSet.SAND, 2, of(), 0, Element.P);
    public static IngotMaterial Platinum = new IngotMaterial(51, "platinum", 0xFFFF99, MaterialIconSet.SHINY, 2, of(), EXT2_METAL | GENERATE_ORE, Element.Pt);
    public static IngotMaterial Plutonium = new IngotMaterial(52, "plutonium", 0xF03232, MaterialIconSet.METALLIC, 3, of(), EXT_METAL, Element.Pu);
    public static IngotMaterial Plutonium241 = new IngotMaterial(53, "plutonium241", 0xFA4646, MaterialIconSet.SHINY, 3, of(), EXT_METAL, Element.Pu_241);
    public static IngotMaterial Potassium = new IngotMaterial(54, "potassium", 0xCECECE, MaterialIconSet.METALLIC, 1, of(), EXT_METAL, Element.K);
    public static IngotMaterial Praseodymium = new IngotMaterial(55, "praseodymium", 0xCECECE, MaterialIconSet.METALLIC, 2, of(), EXT_METAL, Element.Pr, 1208);
    public static IngotMaterial Promethium = new IngotMaterial(56, "promethium", 0xFFFFFF, MaterialIconSet.METALLIC, 2, of(), EXT_METAL, Element.Pm, 1315);
    public static FluidMaterial Radon = new FluidMaterial(57, "radon", 0xFF00FF, MaterialIconSet.FLUID, of(), STATE_GAS | GENERATE_PLASMA, Element.Rn);
    public static IngotMaterial Rubidium = new IngotMaterial(58, "rubidium", 0xF01E1E, MaterialIconSet.METALLIC, 2, of(), STD_METAL, Element.Rb);
    public static IngotMaterial Samarium = new IngotMaterial(59, "samarium", 0xFFFFFF, MaterialIconSet.METALLIC, 2, of(), STD_METAL, Element.Sm, 1345);
    public static IngotMaterial Scandium = new IngotMaterial(60, "scandium", 0xFFFFFF, MaterialIconSet.METALLIC, 2, of(), STD_METAL, Element.Sc, 1814);
    public static IngotMaterial Silicon = new IngotMaterial(61, "silicon", 0x3C3C50, MaterialIconSet.METALLIC, 2, of(), STD_METAL | GENERATE_FOIL, Element.Si, 1687);
    public static IngotMaterial Silver = new IngotMaterial(62, "silver", 0xDCDCFF, MaterialIconSet.SHINY, 2, of(), EXT2_METAL | GENERATE_ORE | MORTAR_GRINDABLE, Element.Ag, 10.0F, 64);
    public static IngotMaterial Sodium = new IngotMaterial(63, "sodium", 0x000096, MaterialIconSet.METALLIC, 2, of(), STD_METAL, Element.Na);
    public static IngotMaterial Strontium = new IngotMaterial(64, "strontium", 0xC8C896, MaterialIconSet.METALLIC, 2, of(), STD_METAL, Element.Sr);
    public static DustMaterial Sulfur = new DustMaterial(65, "sulfur", 0xC8C800, MaterialIconSet.SAND, 2, of(), NO_SMASHING |NO_SMELTING |FLAMMABLE | GENERATE_ORE, Element.S);
    public static IngotMaterial Tantalum = new IngotMaterial(66, "tantalum", 0xFFFFFF, MaterialIconSet.METALLIC, 2, of(), STD_METAL, Element.Ta);
    public static IngotMaterial Tellurium = new IngotMaterial(67, "tellurium", 0xFFFFFF, MaterialIconSet.METALLIC, 2, of(), STD_METAL, Element.Te);
    public static IngotMaterial Terbium = new IngotMaterial(68, "terbium", 0xFFFFFF, MaterialIconSet.METALLIC, 2, of(), STD_METAL, Element.Tb, 1629);
    public static IngotMaterial Thorium = new IngotMaterial(69, "thorium", 0x001E00, MaterialIconSet.SHINY, 2, of(), STD_METAL | GENERATE_ORE, Element.Th, 6.0F, 512);
    public static IngotMaterial Thulium = new IngotMaterial(70, "thulium", 0xFFFFFF, MaterialIconSet.METALLIC, 2, of(), STD_METAL, Element.Tm, 1818);
    public static IngotMaterial Tin = new IngotMaterial(71, "tin", 0xDCDCDC, MaterialIconSet.DULL, 1, of(), EXT2_METAL | MORTAR_GRINDABLE | GENERATE_RING | GENERATE_ROTOR | GENERATE_ORE, Element.Sn);
    public static IngotMaterial Titanium = new IngotMaterial(72, "titanium", 0xDCA0F0, MaterialIconSet.METALLIC, 3, of(), EXT2_METAL | GENERATE_RING | GENERATE_ROTOR | GENERATE_SMALL_GEAR | GENERATE_LONG_ROD | GENERATE_SPRING | GENERATE_FRAME, Element.Ti, 7.0F, 1600, 1941);
    public static FluidMaterial Tritium = new FluidMaterial(73, "tritium", 0xFF0000, MaterialIconSet.METALLIC, of(), STATE_GAS, Element.T);
    public static IngotMaterial Tungsten = new IngotMaterial(74, "tungsten", 0x323232, MaterialIconSet.METALLIC, 3, of(), EXT2_METAL, Element.W, 7.0F, 2560, 3000);
    public static IngotMaterial Uranium = new IngotMaterial(75, "uranium", 0x32F032, MaterialIconSet.METALLIC, 3, of(), STD_METAL | GENERATE_ORE, Element.U, 6.0F, 512);
    public static IngotMaterial Uranium235 = new IngotMaterial(76, "uranium235", 0x46FA46, MaterialIconSet.SHINY, 3, of(), STD_METAL | GENERATE_ORE | GENERATE_ROD, Element.U_235, 6.0F, 512);
    public static IngotMaterial Vanadium = new IngotMaterial(77, "vanadium", 0x323232, MaterialIconSet.METALLIC, 2, of(), STD_METAL, Element.V, 2183);
    public static IngotMaterial Ytterbium = new IngotMaterial(353, "ytterbium", 0xFFFFFF, MaterialIconSet.METALLIC, 2, of(), STD_METAL, Element.Yb, 1097);
    public static IngotMaterial Yttrium = new IngotMaterial(78, "yttrium", 0xDCFADC, MaterialIconSet.METALLIC, 2, of(), STD_METAL, Element.Y, 1799);
    public static IngotMaterial Zinc = new IngotMaterial(79, "zinc", 0xFAF0F0, MaterialIconSet.METALLIC, 1, of(), STD_METAL | GENERATE_ORE | MORTAR_GRINDABLE | GENERATE_FOIL, Element.Zn);

    /**
     * Not possible to determine exact Components
     */
    public static RoughSolidMaterial Wood = new RoughSolidMaterial(196, "wood", 0x896727, MaterialIconSet.WOOD, 0, of(), STD_SOLID | FLAMMABLE | NO_SMELTING | GENERATE_GEAR | GENERATE_LONG_ROD | GENERATE_FRAME, () -> OrePrefix.plank);
    public static FluidMaterial BioFuel = new FluidMaterial(314, "bio_fuel", 0xFF8000, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial Biomass = new FluidMaterial(315, "biomass", 0x00FF00, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial Creosote = new FluidMaterial(316, "creosote", 0x804000, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial Ethanol = new FluidMaterial(317, "ethanol", 0xFF8000, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial Fuel = new FluidMaterial(318, "fuel", 0xFFFF00, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial Glue = new FluidMaterial(319, "glue", 0xC8C400, MaterialIconSet.FLUID, of(), 0);
    public static DustMaterial Gunpowder = new DustMaterial(320, "gunpowder", 0x808080, MaterialIconSet.SAND, 0, of(), FLAMMABLE | EXPLOSIVE | NO_SMELTING | NO_SMASHING);
    public static FluidMaterial Lubricant = new FluidMaterial(321, "lubricant", 0xFFC400, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial McGuffium239 = new FluidMaterial(322, "mc_guffium239", 0xC83296, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial Oil = new FluidMaterial(323, "oil", 0x666666, MaterialIconSet.FLUID, of(), 0);
    public static DustMaterial Oilsands = new DustMaterial(324, "oilsands", 0x0A0A0A, MaterialIconSet.SAND, 1, of(new MaterialStack(Oil, 1L)), GENERATE_ORE);
    public static RoughSolidMaterial Paper = new RoughSolidMaterial(325, "paper", 0xFFFFFF, MaterialIconSet.PAPER, 0, of(), GENERATE_PLATE | FLAMMABLE | NO_SMELTING | NO_SMASHING | MORTAR_GRINDABLE | GENERATE_RING | EXCLUDE_PLATE_COMPRESSOR_RECIPE, () -> OrePrefix.plate);
    public static DustMaterial RareEarth = new DustMaterial(326, "rare_earth", 0x808064, MaterialIconSet.ROUGH, 0, of(), 0);
    public static FluidMaterial SeedOil = new FluidMaterial(327, "seed_oil", 0xC4FF00, MaterialIconSet.FLUID, of(), 0);
    public static DustMaterial Stone = new DustMaterial(328, "stone", 0xCDCDCD, MaterialIconSet.ROUGH, 1, of(), MORTAR_GRINDABLE | GENERATE_GEAR | GENERATE_PLATE | NO_SMASHING | NO_RECYCLING);
    public static FluidMaterial Lava = new FluidMaterial(329, "lava", 0xFF4000, MaterialIconSet.FLUID, of(), 0);
    public static DustMaterial Glowstone = new DustMaterial(330, "glowstone", 0xFFFF00, MaterialIconSet.SHINY, 1, of(), NO_SMASHING | SMELT_INTO_FLUID | GENERATE_PLATE | EXCLUDE_PLATE_COMPRESSOR_RECIPE);
    public static GemMaterial NetherStar = new GemMaterial(331, "nether_star", 0xFFFFFF, MaterialIconSet.NETHERSTAR, 4, of(), STD_SOLID | GENERATE_LENSE | NO_SMASHING | NO_SMELTING);
    public static DustMaterial Endstone = new DustMaterial(332, "endstone", 0xFFFFFF, MaterialIconSet.DULL, 1, of(), NO_SMASHING);
    public static DustMaterial Netherrack = new DustMaterial(333, "netherrack", 0xC80000, MaterialIconSet.ROUGH, 1, of(), NO_SMASHING | FLAMMABLE);
    public static FluidMaterial DrillingFluid = new FluidMaterial(348, "drilling_fluid", 0xFFFFAA, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial ConstructionFoam = new FluidMaterial(347, "construction_foam", 0x333333, MaterialIconSet.FLUID, of(), 0);

    /**
     * First Degree Compounds
     */
    public static FluidMaterial Methane = new FluidMaterial(80, "methane", 0xFFFFFF, MaterialIconSet.FLUID, of(new MaterialStack(Carbon, 1), new MaterialStack(Hydrogen, 4)), 0);
    public static FluidMaterial CarbonDioxide = new FluidMaterial(81, "carbon_dioxide", 0xA9D0F5, MaterialIconSet.FLUID, of(new MaterialStack(Carbon, 1), new MaterialStack(Oxygen, 2)), GENERATE_PLASMA);
    public static FluidMaterial NobleGases = new FluidMaterial(82, "noble_gases", 0xA9D0F5, MaterialIconSet.FLUID, of(new MaterialStack(CarbonDioxide, 21), new MaterialStack(Helium, 9), new MaterialStack(Methane, 3), new MaterialStack(Deuterium, 1)), GENERATE_PLASMA);
    public static FluidMaterial Air = new FluidMaterial(83, "air", 0xA9D0F5, MaterialIconSet.FLUID, of(new MaterialStack(Nitrogen, 40), new MaterialStack(Oxygen, 11), new MaterialStack(Argon, 1), new MaterialStack(NobleGases, 1)), STATE_GAS | DISABLE_DECOMPOSITION);
    public static FluidMaterial LiquidAir = new FluidMaterial(84, "liquid_air", 0xA9D0F5, MaterialIconSet.FLUID, of(new MaterialStack(Nitrogen, 40), new MaterialStack(Oxygen, 11), new MaterialStack(Argon, 1), new MaterialStack(NobleGases, 1)), STATE_GAS | DECOMPOSITION_BY_CENTRIFUGING);
    public static GemMaterial Almandine = new GemMaterial(85, "almandine", 0xFF0000, MaterialIconSet.GEM_VERTICAL, 1, of(new MaterialStack(Aluminium, 2), new MaterialStack(Iron, 3), new MaterialStack(Silicon, 3), new MaterialStack(Oxygen, 12)), STD_GEM);
    public static DustMaterial Andradite = new DustMaterial(86, "andradite", 0x967800, MaterialIconSet.GEM_VERTICAL, 1, of(new MaterialStack(Calcium, 3), new MaterialStack(Iron, 2), new MaterialStack(Silicon, 3), new MaterialStack(Oxygen, 12)), 0);
    public static IngotMaterial AnnealedCopper = new IngotMaterial(87, "annealed_copper", 0xFF7814, MaterialIconSet.SHINY, 2, of(new MaterialStack(Copper, 1)), EXT2_METAL | MORTAR_GRINDABLE);
    public static DustMaterial Asbestos = new DustMaterial(88, "asbestos", 0xE6E6E6, MaterialIconSet.SAND, 1, of(new MaterialStack(Magnesium, 3), new MaterialStack(Silicon, 2), new MaterialStack(Hydrogen, 4), new MaterialStack(Oxygen, 9)), 0);
    public static DustMaterial Ash = new DustMaterial(89, "ash", 0x969696, MaterialIconSet.SAND, 1, of(new MaterialStack(Carbon, 1)), 0);
    public static DustMaterial BandedIron = new DustMaterial(90, "banded_iron", 0x915A5A, MaterialIconSet.DULL, 2, of(new MaterialStack(Iron, 2), new MaterialStack(Oxygen, 3)), GENERATE_ORE);
    public static IngotMaterial BatteryAlloy = new IngotMaterial(91, "battery_alloy", 0x9C7CA0, MaterialIconSet.DULL, 1, of(new MaterialStack(Lead, 4), new MaterialStack(Antimony, 1)), EXT_METAL);
    public static GemMaterial BlueTopaz = new GemMaterial(92, "blue_topaz", 0x0000FF, MaterialIconSet.GEM_HORIZONTAL, 3, of(new MaterialStack(Aluminium, 2), new MaterialStack(Silicon, 1), new MaterialStack(Fluorine, 2), new MaterialStack(Hydrogen, 2), new MaterialStack(Oxygen, 6)), STD_GEM | NO_SMASHING | NO_SMELTING | HIGH_SIFTER_OUTPUT, 7.0F, 256);
    public static DustMaterial Bone = new DustMaterial(93, "bone", 0xFFFFFF, MaterialIconSet.ROUGH, 1, of(new MaterialStack(Calcium, 1)), 0);
    public static IngotMaterial Brass = new IngotMaterial(94, "brass", 0xFFB400, MaterialIconSet.METALLIC, 1, of(new MaterialStack(Zinc, 1), new MaterialStack(Copper, 3)), EXT2_METAL | MORTAR_GRINDABLE | GENERATE_RING, 7.0F, 128);
    public static IngotMaterial Bronze = new IngotMaterial(95, "bronze", 0xFF8000, MaterialIconSet.DULL, 2, of(new MaterialStack(Tin, 1), new MaterialStack(Copper, 3)), EXT2_METAL | MORTAR_GRINDABLE | GENERATE_RING | GENERATE_ROTOR | GENERATE_FRAME, 6.0F, 192);
    public static DustMaterial BrownLimonite = new DustMaterial(96, "brown_limonite", 0xC86400, MaterialIconSet.METALLIC, 1, of(new MaterialStack(Iron, 1), new MaterialStack(Hydrogen, 1), new MaterialStack(Oxygen, 2)), GENERATE_ORE);
    public static DustMaterial Calcite = new DustMaterial(97, "calcite", 0xFAE6DC, MaterialIconSet.DULL, 1, of(new MaterialStack(Calcium, 1), new MaterialStack(Carbon, 1), new MaterialStack(Oxygen, 3)), GENERATE_ORE);
    public static DustMaterial Cassiterite = new DustMaterial(98, "cassiterite", 0xDCDCDC, MaterialIconSet.METALLIC, 1, of(new MaterialStack(Tin, 1), new MaterialStack(Oxygen, 2)), GENERATE_ORE);
    public static DustMaterial CassiteriteSand = new DustMaterial(99, "cassiterite_sand", 0xDCDCDC, MaterialIconSet.SAND, 1, of(new MaterialStack(Tin, 1), new MaterialStack(Oxygen, 2)), GENERATE_ORE);
    public static DustMaterial Chalcopyrite = new DustMaterial(100, "chalcopyrite", 0xA07828, MaterialIconSet.DULL, 1, of(new MaterialStack(Copper, 1), new MaterialStack(Iron, 1), new MaterialStack(Sulfur, 2)), GENERATE_ORE | INDUCTION_SMELTING_LOW_OUTPUT);
    public static GemMaterial Charcoal = new GemMaterial(101, "charcoal", 0x644646, MaterialIconSet.LIGNITE, 1, of(new MaterialStack(Carbon, 1)), FLAMMABLE | NO_SMELTING | NO_SMASHING | MORTAR_GRINDABLE);
    public static DustMaterial Chromite = new DustMaterial(102, "chromite", 0x23140F, MaterialIconSet.METALLIC, 1, of(new MaterialStack(Iron, 1), new MaterialStack(Chrome, 2), new MaterialStack(Oxygen, 4)), GENERATE_ORE, null);
    public static GemMaterial Cinnabar = new GemMaterial(103, "cinnabar", 0x960000, MaterialIconSet.EMERALD, 1, of(new MaterialStack(Mercury, 1), new MaterialStack(Sulfur, 1)), GENERATE_ORE | CRYSTALLISABLE);
    public static FluidMaterial Water = new FluidMaterial(104, "water", 0x0000FF, MaterialIconSet.FLUID, of(new MaterialStack(Hydrogen, 2), new MaterialStack(Oxygen, 1)), NO_RECYCLING);
    public static DustMaterial Clay = new DustMaterial(105, "clay", 0xC8C8DC, MaterialIconSet.ROUGH, 1, of(new MaterialStack(Sodium, 2), new MaterialStack(Lithium, 1), new MaterialStack(Aluminium, 2), new MaterialStack(Silicon, 2), new MaterialStack(Water, 6)), MORTAR_GRINDABLE);
    public static GemMaterial Coal = new GemMaterial(106, "coal", 0x464646, MaterialIconSet.LIGNITE, 1, of(new MaterialStack(Carbon, 1)), GENERATE_ORE | FLAMMABLE | NO_SMELTING | NO_SMASHING | MORTAR_GRINDABLE);
    public static DustMaterial Cobaltite = new DustMaterial(107, "cobaltite", 0x5050FA, MaterialIconSet.ROUGH, 1, of(new MaterialStack(Cobalt, 1), new MaterialStack(Arsenic, 1), new MaterialStack(Sulfur, 1)), GENERATE_ORE);
    public static DustMaterial Cooperite = new DustMaterial(108, "cooperite", 0xFFFFC8, MaterialIconSet.METALLIC, 1, of(new MaterialStack(Platinum, 3), new MaterialStack(Nickel, 1), new MaterialStack(Sulfur, 1), new MaterialStack(Palladium, 1)), GENERATE_ORE);
    public static IngotMaterial Cupronickel = new IngotMaterial(109, "cupronickel", 0xE39680, MaterialIconSet.METALLIC, 1, of(new MaterialStack(Copper, 1), new MaterialStack(Nickel, 1)), EXT_METAL,  6.0F, 64);
    public static DustMaterial DarkAsh = new DustMaterial(110, "dark_ash", 0x323232, MaterialIconSet.SAND, 1, of(new MaterialStack(Carbon, 1)), DISABLE_DECOMPOSITION);
    public static GemMaterial Diamond = new GemMaterial(111, "diamond", 0xC8FFFF, MaterialIconSet.DIAMOND, 3, of(new MaterialStack(Carbon, 1)), GENERATE_ROD | GENERATE_BOLT_SCREW | GENERATE_LENSE | GENERATE_GEAR | NO_SMASHING | NO_SMELTING | FLAMMABLE | HIGH_SIFTER_OUTPUT | GENERATE_ORE, 8.0F, 1280);
    public static IngotMaterial Electrum = new IngotMaterial(112, "electrum", 0xFFFF64, MaterialIconSet.SHINY, 2, of(new MaterialStack(Silver, 1), new MaterialStack(Gold, 1)), EXT2_METAL | MORTAR_GRINDABLE);
    public static GemMaterial Emerald = new GemMaterial(113, "emerald", 0x50FF50, MaterialIconSet.EMERALD, 2, of(new MaterialStack(Beryllium, 3), new MaterialStack(Aluminium, 2), new MaterialStack(Silicon, 6), new MaterialStack(Oxygen, 18)), STD_GEM | NO_SMASHING | NO_SMELTING | HIGH_SIFTER_OUTPUT, 7.0F, 256);
    public static DustMaterial Galena = new DustMaterial(114, "galena", 0x643C64, MaterialIconSet.ROUGH, 3, of(new MaterialStack(Lead, 3), new MaterialStack(Silver, 3), new MaterialStack(Sulfur, 2)), GENERATE_ORE | NO_SMELTING);
    public static DustMaterial Garnierite = new DustMaterial(115, "garnierite", 0x32C846, MaterialIconSet.ROUGH, 3, of(new MaterialStack(Nickel, 1), new MaterialStack(Oxygen, 1)), GENERATE_ORE);
    public static FluidMaterial Glyceryl = new FluidMaterial(116, "glyceryl", 0x009696, MaterialIconSet.FLUID, of(new MaterialStack(Carbon, 3), new MaterialStack(Hydrogen, 5), new MaterialStack(Nitrogen, 3), new MaterialStack(Oxygen, 9)), FLAMMABLE | EXPLOSIVE | NO_SMELTING | NO_SMASHING);
    public static GemMaterial GreenSapphire = new GemMaterial(117, "green_sapphire", 0x64C882, MaterialIconSet.GEM_HORIZONTAL, 2, of(new MaterialStack(Aluminium, 2), new MaterialStack(Oxygen, 3)), GENERATE_ORE | NO_SMASHING | NO_SMELTING | HIGH_SIFTER_OUTPUT, 7.0F, 256);
    public static DustMaterial Grossular = new DustMaterial(118, "grossular", 0xC86400, MaterialIconSet.GEM_VERTICAL, 1, of(new MaterialStack(Calcium, 3), new MaterialStack(Aluminium, 2), new MaterialStack(Silicon, 3), new MaterialStack(Oxygen, 12)), GENERATE_ORE);
    public static FluidMaterial DistilledWater = new FluidMaterial(119, "distilled_water", 0x0000FF, MaterialIconSet.FLUID, of(new MaterialStack(Hydrogen, 2), new MaterialStack(Oxygen, 1)), NO_RECYCLING);
    public static DustMaterial Ice = new DustMaterial(120, "ice", 0xC8C8FF, MaterialIconSet.ROUGH, 0, of(new MaterialStack(Hydrogen, 2), new MaterialStack(Oxygen, 1)), NO_SMASHING | NO_RECYCLING | SMELT_INTO_FLUID | EXCLUDE_BLOCK_CRAFTING_RECIPES | DISABLE_DECOMPOSITION);
    public static DustMaterial Ilmenite = new DustMaterial(121, "ilmenite", 0x463732, MaterialIconSet.ROUGH, 3, of(new MaterialStack(Iron, 1), new MaterialStack(Titanium, 1), new MaterialStack(Oxygen, 3)), GENERATE_ORE | DISABLE_DECOMPOSITION);
    public static GemMaterial Rutile = new GemMaterial(122, "rutile", 0xD40D5C, MaterialIconSet.GEM_HORIZONTAL, 2, of(new MaterialStack(Titanium, 1), new MaterialStack(Oxygen, 2)), STD_GEM | DISABLE_DECOMPOSITION);
    public static DustMaterial Bauxite = new DustMaterial(123, "bauxite", 0xC86400, MaterialIconSet.ROUGH, 1, of(new MaterialStack(Rutile, 2), new MaterialStack(Aluminium, 16), new MaterialStack(Hydrogen, 10), new MaterialStack(Oxygen, 11)), GENERATE_ORE);
    public static FluidMaterial TitaniumTetrachloride = new FluidMaterial(124, "titanium_tetrachloride", 0xD40D5C, MaterialIconSet.FLUID, of(new MaterialStack(Titanium, 1), new MaterialStack(Carbon, 2), new MaterialStack(Chlorine, 2)), DISABLE_DECOMPOSITION);
    public static DustMaterial MagnesiumChloride = new DustMaterial(125, "magnesium_chloride", 0xD40D5C, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Magnesium, 1), new MaterialStack(Chlorine, 2)), 0);
    public static IngotMaterial Invar = new IngotMaterial(126, "invar", 0xB4B478, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Iron, 2), new MaterialStack(Nickel, 1)), EXT2_METAL | MORTAR_GRINDABLE | GENERATE_RING | GENERATE_FRAME, 6.0F, 256);
    public static IngotMaterial Kanthal = new IngotMaterial(127, "kanthal", 0xC2D2DF, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Iron, 1), new MaterialStack(Aluminium, 1), new MaterialStack(Chrome, 1)), EXT_METAL, null, 1800);
    public static GemMaterial Lazurite = new GemMaterial(128, "lazurite", 0x6478FF, MaterialIconSet.LAPIS, 1, of(new MaterialStack(Aluminium, 6), new MaterialStack(Silicon, 6), new MaterialStack(Calcium, 8), new MaterialStack(Sodium, 8)), GENERATE_PLATE | GENERATE_ORE | NO_SMASHING | NO_SMELTING | CRYSTALLISABLE | GENERATE_ROD | DECOMPOSITION_BY_ELECTROLYZING);
    public static IngotMaterial Magnalium = new IngotMaterial(129, "magnalium", 0xC8BEFF, MaterialIconSet.DULL, 2, of(new MaterialStack(Magnesium, 1), new MaterialStack(Aluminium, 2)), EXT2_METAL | GENERATE_LONG_ROD, 6.0F, 256);
    public static DustMaterial Magnesite = new DustMaterial(130, "magnesite", 0xFAFAB4, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Magnesium, 1), new MaterialStack(Carbon, 1), new MaterialStack(Oxygen, 3)), GENERATE_ORE);
    public static DustMaterial Magnetite = new DustMaterial(131, "magnetite", 0x1E1E1E, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Iron, 3), new MaterialStack(Oxygen, 4)), GENERATE_ORE);
    public static DustMaterial Molybdenite = new DustMaterial(132, "molybdenite", 0x191919, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Molybdenum, 1), new MaterialStack(Sulfur, 2)), GENERATE_ORE);
    public static IngotMaterial Nichrome = new IngotMaterial(133, "nichrome", 0xCDCEF6, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Nickel, 4), new MaterialStack(Chrome, 1)), EXT_METAL, null, 2700);
    public static IngotMaterial NiobiumNitride = new IngotMaterial(134, "niobium_nitride", 0x1D291D, MaterialIconSet.DULL, 2, of(new MaterialStack(Niobium, 1), new MaterialStack(Nitrogen, 1)), EXT_METAL, null, 2573);
    public static IngotMaterial NiobiumTitanium = new IngotMaterial(135, "niobium_titanium", 0x1D1D29, MaterialIconSet.DULL, 2, of(new MaterialStack(Niobium, 1), new MaterialStack(Titanium, 1)), EXT2_METAL, null, 4500);
    public static FluidMaterial NitroCarbon = new FluidMaterial(136, "nitro_carbon", 0x004B64, MaterialIconSet.FLUID, of(new MaterialStack(Nitrogen, 1), new MaterialStack(Carbon, 1)), 0);
    public static FluidMaterial NitrogenDioxide = new FluidMaterial(137, "nitrogen_dioxide", 0x64AFFF, MaterialIconSet.FLUID, of(new MaterialStack(Nitrogen, 1), new MaterialStack(Oxygen, 2)), 0);
    public static DustMaterial Obsidian = new DustMaterial(138, "obsidian", 0x503264, MaterialIconSet.DULL, 3, of(new MaterialStack(Magnesium, 1), new MaterialStack(Iron, 1), new MaterialStack(Silicon, 2), new MaterialStack(Oxygen, 8)), NO_SMASHING | EXCLUDE_BLOCK_CRAFTING_RECIPES);
    public static DustMaterial Phosphate = new DustMaterial(139, "phosphate", 0xFFFF00, MaterialIconSet.ROUGH, 1, of(new MaterialStack(Phosphorus, 1), new MaterialStack(Oxygen, 4)), GENERATE_ORE | NO_SMASHING | NO_SMELTING | FLAMMABLE | EXPLOSIVE);
    public static IngotMaterial PigIron = new IngotMaterial(140, "pig_iron", 0xC8B4B4, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Iron, 1)), EXT_METAL | GENERATE_RING, 6.0F, 384);
    public static IngotMaterial Plastic = new IngotMaterial(141, "plastic", 0xC8C8C8, MaterialIconSet.DULL, 1, of(new MaterialStack(Carbon, 1), new MaterialStack(Hydrogen, 2)), GENERATE_PLATE | FLAMMABLE | NO_SMASHING | SMELT_INTO_FLUID);
    public static IngotMaterial Epoxid = new IngotMaterial(142, "epoxid", 0xC88C14, MaterialIconSet.DULL, 1, of(new MaterialStack(Carbon, 2), new MaterialStack(Hydrogen, 4), new MaterialStack(Oxygen, 1)), EXT2_METAL);
    public static DustMaterial Silicone = new DustMaterial(143, "silicone", 0xDCDCDC, MaterialIconSet.DULL, 1, of(new MaterialStack(Carbon, 1), new MaterialStack(Hydrogen, 1), new MaterialStack(Silicon, 2), new MaterialStack(Oxygen, 1)), GENERATE_PLATE | FLAMMABLE | NO_SMASHING | SMELT_INTO_FLUID);
    public static IngotMaterial Polycaprolactam = new IngotMaterial(144, "polycaprolactam", 0x323232, MaterialIconSet.DULL, 1, of(new MaterialStack(Carbon, 6), new MaterialStack(Hydrogen, 11), new MaterialStack(Nitrogen, 1), new MaterialStack(Oxygen, 1)), GENERATE_PLATE);
    public static IngotMaterial Polytetrafluoroethylene = new IngotMaterial(145, "polytetrafluoroethylene", 0x646464, MaterialIconSet.DULL, 1, of(new MaterialStack(Carbon, 2), new MaterialStack(Fluorine, 4)), GENERATE_PLATE | SMELT_INTO_FLUID | NO_WORKING);
    public static DustMaterial Powellite = new DustMaterial(146, "powellite", 0xFFFF00, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Calcium, 1), new MaterialStack(Molybdenum, 1), new MaterialStack(Oxygen, 4)), GENERATE_ORE);
    public static DustMaterial Pumice = new DustMaterial(147, "pumice", 0xE6B9B9, MaterialIconSet.PAPER, 2, of(new MaterialStack(Stone, 1)), 0);
    public static DustMaterial Pyrite = new DustMaterial(148, "pyrite", 0x967828, MaterialIconSet.ROUGH, 1, of(new MaterialStack(Iron, 1), new MaterialStack(Sulfur, 2)), GENERATE_ORE | INDUCTION_SMELTING_LOW_OUTPUT);
    public static DustMaterial Pyrolusite = new DustMaterial(149, "pyrolusite", 0x9696AA, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Manganese, 1), new MaterialStack(Oxygen, 2)), GENERATE_ORE);
    public static DustMaterial Pyrope = new DustMaterial(150, "pyrope", 0x783264, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Aluminium, 2), new MaterialStack(Magnesium, 3), new MaterialStack(Silicon, 3), new MaterialStack(Oxygen, 12)), GENERATE_ORE);
    public static DustMaterial RockSalt = new DustMaterial(151, "rock_salt", 0xF0C8C8, MaterialIconSet.FINE, 1, of(new MaterialStack(Potassium, 1), new MaterialStack(Chlorine, 1)), GENERATE_ORE | NO_SMASHING);
    public static IngotMaterial Rubber = new IngotMaterial(152, "rubber", 0x151515, MaterialIconSet.ROUGH, 0, of(new MaterialStack(Carbon, 5), new MaterialStack(Hydrogen, 8)), GENERATE_PLATE | GENERATE_GEAR | GENERATE_RING | FLAMMABLE | NO_SMASHING | GENERATE_RING | NO_WORKING);
    public static DustMaterial RawRubber = new DustMaterial(153, "raw_rubber", 0xCCC789, MaterialIconSet.SAND, 0, of(new MaterialStack(Carbon, 5), new MaterialStack(Hydrogen, 8)), 0);
    public static GemMaterial Ruby = new GemMaterial(154, "ruby", 0xBD4949, MaterialIconSet.RUBY, 2, of(new MaterialStack(Chrome, 1), new MaterialStack(Aluminium, 2), new MaterialStack(Oxygen, 3)), STD_GEM | NO_SMASHING | NO_SMELTING | HIGH_SIFTER_OUTPUT, 7.0F, 256);
    public static DustMaterial Salt = new DustMaterial(155, "salt", 0xFFFFFF, MaterialIconSet.SAND, 1, of(new MaterialStack(Sodium, 1), new MaterialStack(Chlorine, 1)), GENERATE_ORE | NO_SMASHING);
    public static DustMaterial Saltpeter = new DustMaterial(156, "saltpeter", 0xE6E6E6, MaterialIconSet.FINE, 1, of(new MaterialStack(Potassium, 1), new MaterialStack(Nitrogen, 1), new MaterialStack(Oxygen, 3)), GENERATE_ORE | NO_SMASHING |NO_SMELTING |FLAMMABLE);
    public static GemMaterial Sapphire = new GemMaterial(157, "sapphire", 0x6464C8, MaterialIconSet.GEM_VERTICAL, 2, of(new MaterialStack(Aluminium, 2), new MaterialStack(Oxygen, 3)), STD_GEM | NO_SMASHING | NO_SMELTING | HIGH_SIFTER_OUTPUT, null, 7.0F, 256);
    public static DustMaterial Scheelite = new DustMaterial(158, "scheelite", 0xC88C14, MaterialIconSet.DULL, 3, of(new MaterialStack(Tungsten, 1), new MaterialStack(Calcium, 2), new MaterialStack(Oxygen, 4)), GENERATE_ORE | DECOMPOSITION_REQUIRES_HYDROGEN);
    public static DustMaterial SiliconDioxide = new DustMaterial(159, "silicon_dioxide", 0xC8C8C8, MaterialIconSet.QUARTZ, 1, of(new MaterialStack(Silicon, 1), new MaterialStack(Oxygen, 2)), NO_SMASHING | NO_SMELTING | CRYSTALLISABLE);
    public static GemMaterial Sodalite = new GemMaterial(161, "sodalite", 0x1414FF, MaterialIconSet.LAPIS, 1, of(new MaterialStack(Aluminium, 3), new MaterialStack(Silicon, 3), new MaterialStack(Sodium, 4), new MaterialStack(Chlorine, 1)), GENERATE_ORE | GENERATE_PLATE | GENERATE_ROD | NO_SMASHING | NO_SMELTING | CRYSTALLISABLE | GENERATE_ROD | DECOMPOSITION_BY_ELECTROLYZING);
    public static FluidMaterial SodiumPersulfate = new FluidMaterial(162, "sodium_persulfate", 0xFFFFFF, MaterialIconSet.FLUID, of(new MaterialStack(Sodium, 1), new MaterialStack(Sulfur, 1), new MaterialStack(Oxygen, 4)), 0);
    public static FluidMaterial SodiumSulfide = new FluidMaterial(163, "sodium_sulfide", 0xAAAA00, MaterialIconSet.FLUID, of(new MaterialStack(Sodium, 2), new MaterialStack(Sulfur, 1)), 0);
    public static FluidMaterial HydrogenSulfide = new FluidMaterial(164, "hydrogen_sulfide", 0xFFFFFF, MaterialIconSet.FLUID, of(new MaterialStack(Hydrogen, 2), new MaterialStack(Sulfur, 1)), 0);
    public static FluidMaterial Steam = new FluidMaterial(346, "steam", 0xFFFFFF, MaterialIconSet.GAS, of(new MaterialStack(Hydrogen, 2), new MaterialStack(Oxygen, 1)), NO_RECYCLING | GENERATE_FLUID_BLOCK);
    public static FluidMaterial Epichlorhydrin = new FluidMaterial(349, "epichlorhydrin", 0xFFFFFF, MaterialIconSet.FLUID, of(new MaterialStack(Carbon, 3), new MaterialStack(Hydrogen, 5), new MaterialStack(Chlorine, 1), new MaterialStack(Oxygen, 1)), 0);
    public static FluidMaterial NitricAcid = new FluidMaterial(351, "nitric_acid", 0xCCCC00, MaterialIconSet.FLUID, of(new MaterialStack(Hydrogen, 1), new MaterialStack(Nitrogen, 1), new MaterialStack(Oxygen, 3)), 0);
    public static DustMaterial Brick = new DustMaterial(355, "brick", 0xB75A40, MaterialIconSet.FINE, 1, of(new MaterialStack(Clay, 1)), EXCLUDE_BLOCK_CRAFTING_RECIPES | DECOMPOSITION_BY_CENTRIFUGING);
    public static DustMaterial Fireclay = new DustMaterial(356, "fireclay", 0x928073, MaterialIconSet.FINE, 2, of(new MaterialStack(Clay, 1), new MaterialStack(Brick, 1)), DECOMPOSITION_BY_CENTRIFUGING);
    public static GemMaterial Coke = new GemMaterial(357, "coke", 0x666666, MaterialIconSet.LIGNITE, 1, of(new MaterialStack(Carbon, 1)), FLAMMABLE | NO_SMELTING | NO_SMASHING | MORTAR_GRINDABLE);

    public static FluidMaterial OilHeavy = new FluidMaterial(165, "oil_heavy", 0x666666, MaterialIconSet.FLUID, of(), GENERATE_FLUID_BLOCK);
    public static FluidMaterial OilMedium = new FluidMaterial(166, "oil_medium", 0x666666, MaterialIconSet.FLUID, of(), GENERATE_FLUID_BLOCK);
    public static FluidMaterial OilLight = new FluidMaterial(167, "oil_light", 0x666666, MaterialIconSet.FLUID, of(), GENERATE_FLUID_BLOCK);
    public static FluidMaterial NaturalGas = new FluidMaterial(168, "natural_gas", 0xFFFFFF, MaterialIconSet.FLUID, of(), STATE_GAS | GENERATE_FLUID_BLOCK);
    public static FluidMaterial SulfuricGas = new FluidMaterial(169, "sulfuric_gas", 0xFFFFFF, MaterialIconSet.FLUID, of(), STATE_GAS);
    public static FluidMaterial Gas = new FluidMaterial(170, "gas", 0xFFFFFF, MaterialIconSet.FLUID, of(), STATE_GAS);
    public static FluidMaterial SulfuricNaphtha = new FluidMaterial(171, "sulfuric_naphtha", 0xFFFF00, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial SulfuricLightFuel = new FluidMaterial(172, "sulfuric_light_fuel", 0xFFFF00, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial SulfuricHeavyFuel = new FluidMaterial(173, "sulfuric_heavy_fuel", 0xFFFF00, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial Naphtha = new FluidMaterial(174, "naphtha", 0xFFFF00, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial LightFuel = new FluidMaterial(175, "light_fuel", 0xFFFF00, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial HeavyFuel = new FluidMaterial(176, "heavy_fuel", 0xFFFF00, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial LPG = new FluidMaterial(177, "lpg", 0xFFFF00, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial CrackedLightFuel = new FluidMaterial(178, "cracked_light_fuel", 0xFFFF00, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial CrackedHeavyFuel = new FluidMaterial(179, "cracked_heavy_fuel", 0xFFFF00, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial Toluene = new FluidMaterial(350, "toluene", 0xFFFFFF, MaterialIconSet.FLUID, of(), 0);

    public static IngotMaterial SolderingAlloy = new IngotMaterial(180, "soldering_alloy", 0xDCDCE6, MaterialIconSet.DULL, 1, of(new MaterialStack(Tin, 9), new MaterialStack(Antimony, 1)), EXT_METAL | GENERATE_FINE_WIRE, null);
    public static DustMaterial Spessartine = new DustMaterial(181, "spessartine", 0xFF6464, MaterialIconSet.GEM_VERTICAL, 2, of(new MaterialStack(Aluminium, 2), new MaterialStack(Manganese, 3), new MaterialStack(Silicon, 3), new MaterialStack(Oxygen, 12)), GENERATE_ORE);
    public static DustMaterial Sphalerite = new DustMaterial(182, "sphalerite", 0xFFFFFF, MaterialIconSet.ROUGH, 1, of(new MaterialStack(Zinc, 1), new MaterialStack(Sulfur, 1)), GENERATE_ORE | INDUCTION_SMELTING_LOW_OUTPUT);
    public static IngotMaterial StainlessSteel = new IngotMaterial(183, "stainless_steel", 0xC8C8DC, MaterialIconSet.SHINY, 2, of(new MaterialStack(Iron, 6), new MaterialStack(Chrome, 1), new MaterialStack(Manganese, 1), new MaterialStack(Nickel, 1)), EXT2_METAL | GENERATE_RING | GENERATE_ROTOR | GENERATE_SMALL_GEAR | GENERATE_FRAME, null, 7.0F, 480, 1700);
    public static IngotMaterial Steel = new IngotMaterial(184, "steel", 0x505050, MaterialIconSet.DULL, 2, of(new MaterialStack(Iron, 50), new MaterialStack(Carbon, 1)), EXT2_METAL | MORTAR_GRINDABLE | GENERATE_RING | GENERATE_ROTOR | GENERATE_SMALL_GEAR | GENERATE_DENSE | DISABLE_DECOMPOSITION | GENERATE_FRAME, null, 6.0F, 512, 1000);
    public static DustMaterial Stibnite = new DustMaterial(185, "stibnite", 0x464646, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Antimony, 2), new MaterialStack(Sulfur, 3)), GENERATE_ORE);
    public static FluidMaterial SulfuricAcid = new FluidMaterial(186, "sulfuric_acid", 0xFF8000, MaterialIconSet.FLUID, of(new MaterialStack(Hydrogen, 2), new MaterialStack(Sulfur, 1), new MaterialStack(Oxygen, 4)), 0);
    public static GemMaterial Tanzanite = new GemMaterial(187, "tanzanite", 0x4000C8, MaterialIconSet.GEM_VERTICAL, 2, of(new MaterialStack(Calcium, 2), new MaterialStack(Aluminium, 3), new MaterialStack(Silicon, 3), new MaterialStack(Hydrogen, 1), new MaterialStack(Oxygen, 13)), EXT_METAL | GENERATE_ORE | NO_SMASHING | NO_SMELTING | HIGH_SIFTER_OUTPUT, null, 7.0F, 256);
    public static DustMaterial Tetrahedrite = new DustMaterial(188, "tetrahedrite", 0xC82000, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Copper, 3), new MaterialStack(Antimony, 1), new MaterialStack(Sulfur, 3), new MaterialStack(Iron, 1)), GENERATE_ORE | INDUCTION_SMELTING_LOW_OUTPUT);
    public static IngotMaterial TinAlloy = new IngotMaterial(189, "tin_alloy", 0xC8C8C8, MaterialIconSet.DULL, 2, of(new MaterialStack(Tin, 1), new MaterialStack(Iron, 1)), EXT2_METAL, null, 6.5F, 96);
    public static GemMaterial Topaz = new GemMaterial(190, "topaz", 0xFF8000, MaterialIconSet.GEM_HORIZONTAL, 3, of(new MaterialStack(Aluminium, 2), new MaterialStack(Silicon, 1), new MaterialStack(Fluorine, 2), new MaterialStack(Hydrogen, 2), new MaterialStack(Oxygen, 6)), STD_GEM | NO_SMASHING | NO_SMELTING | HIGH_SIFTER_OUTPUT, null, 7.0F, 256);
    public static DustMaterial Tungstate = new DustMaterial(191, "tungstate", 0x373223, MaterialIconSet.DULL, 3, of(new MaterialStack(Tungsten, 1), new MaterialStack(Lithium, 2), new MaterialStack(Oxygen, 4)), GENERATE_ORE | DECOMPOSITION_REQUIRES_HYDROGEN, null);
    public static IngotMaterial Ultimet = new IngotMaterial(192, "ultimet", 0xB4B4E6, MaterialIconSet.SHINY, 4, of(new MaterialStack(Cobalt, 5), new MaterialStack(Chrome, 2), new MaterialStack(Nickel, 1), new MaterialStack(Molybdenum, 1)), EXT2_METAL, null, 9.0F, 2048, 2700);
    public static DustMaterial Uraninite = new DustMaterial(193, "uraninite", 0x232323, MaterialIconSet.ROUGH, 3, of(new MaterialStack(Uranium, 1), new MaterialStack(Oxygen, 2)), GENERATE_ORE | DISABLE_DECOMPOSITION);
    public static DustMaterial Uvarovite = new DustMaterial(194, "uvarovite", 0xB4FFB4, MaterialIconSet.GEM_VERTICAL, 2, of(new MaterialStack(Calcium, 3), new MaterialStack(Chrome, 2), new MaterialStack(Silicon, 3), new MaterialStack(Oxygen, 12)), 0);
    public static IngotMaterial VanadiumGallium = new IngotMaterial(195, "vanadium_gallium", 0x80808C, MaterialIconSet.SHINY, 2, of(new MaterialStack(Vanadium, 3), new MaterialStack(Gallium, 1)), STD_METAL | GENERATE_FOIL | GENERATE_ROD, null, 4500);
    public static IngotMaterial WroughtIron = new IngotMaterial(197, "wrought_iron", 0xC8B4B4, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Iron, 1)), EXT2_METAL | MORTAR_GRINDABLE | GENERATE_RING | GENERATE_LONG_ROD, null, 6.0F, 384);
    public static DustMaterial Wulfenite = new DustMaterial(198, "wulfenite", 0xFF8000, MaterialIconSet.DULL, 3, of(new MaterialStack(Lead, 1), new MaterialStack(Molybdenum, 1), new MaterialStack(Oxygen, 4)), GENERATE_ORE);
    public static DustMaterial YellowLimonite = new DustMaterial(199, "yellow_limonite", 0xC8C800, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Iron, 1), new MaterialStack(Hydrogen, 1), new MaterialStack(Oxygen, 2)), GENERATE_ORE | INDUCTION_SMELTING_LOW_OUTPUT);
    public static IngotMaterial YttriumBariumCuprate = new IngotMaterial(200, "yttrium_barium_cuprate", 0x504046, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Yttrium, 1), new MaterialStack(Barium, 2), new MaterialStack(Copper, 3), new MaterialStack(Oxygen, 7)), EXT_METAL | GENERATE_FOIL, null, 4500);
    public static GemMaterial NetherQuartz = new GemMaterial(201, "nether_quartz", 0xE6D2D2, MaterialIconSet.QUARTZ, 1, of(), STD_SOLID | NO_SMELTING | CRYSTALLISABLE | GENERATE_ORE, null, 1.0F, 32);
    public static GemMaterial CertusQuartz = new GemMaterial(202, "certus_quartz", 0xD2D2E6, MaterialIconSet.QUARTZ, 1, of(), STD_SOLID | NO_SMELTING | CRYSTALLISABLE | GENERATE_ORE, null, 5.0F, 32);
    public static GemMaterial Quartzite = new GemMaterial(203, "quartzite", 0xD2E6D2, MaterialIconSet.QUARTZ, 1, of(), NO_SMELTING | CRYSTALLISABLE | GENERATE_ORE);
    public static IngotMaterial Graphite = new IngotMaterial(204, "graphite", 0x808080, MaterialIconSet.DULL, 2, of(), GENERATE_PLATE | GENERATE_ORE | NO_SMELTING |FLAMMABLE);
    public static IngotMaterial Graphene = new IngotMaterial(205, "graphene", 0x808080, MaterialIconSet.SHINY, 2, of(), GENERATE_PLATE);
    public static GemMaterial Jasper = new GemMaterial(206, "jasper", 0xC85050, MaterialIconSet.EMERALD, 2, of(), STD_GEM | NO_SMELTING | HIGH_SIFTER_OUTPUT);
    public static IngotMaterial Osmiridium = new IngotMaterial(207, "osmiridium", 0x6464FF, MaterialIconSet.METALLIC, 3, of(new MaterialStack(Iridium, 3), new MaterialStack(Osmium, 1)), EXT2_METAL, null, 7.0F, 1600, 2500);
    public static FluidMaterial NitrationMixture = new FluidMaterial(352, "nitration_mixture", 0xEEEEAA, MaterialIconSet.FLUID, of(new MaterialStack(NitricAcid, 1), new MaterialStack(SulfuricAcid, 1)), 0);
    public static DustMaterial Tenorite = new DustMaterial(358, "tenorite", 0x606060, MaterialIconSet.FINE, 1, of(new MaterialStack(Copper, 1), new MaterialStack(Oxygen, 1)), GENERATE_ORE);
    public static DustMaterial Cuprite = new DustMaterial(359, "cuprite", 0x770000, MaterialIconSet.RUBY, 2, of(new MaterialStack(Copper, 2), new MaterialStack(Oxygen, 1)), GENERATE_ORE);
    public static DustMaterial Bornite = new DustMaterial(360, "bornite", 0xC11800, MaterialIconSet.DULL, 1, of(new MaterialStack(Copper, 5), new MaterialStack(Iron, 1), new MaterialStack(Sulfur, 4)), GENERATE_ORE);
    public static DustMaterial Chalcocite = new DustMaterial(361, "chalcocite", 0x353535, MaterialIconSet.GEM_VERTICAL, 2, of(new MaterialStack(Copper, 2), new MaterialStack(Sulfur, 1)), GENERATE_ORE);
    public static DustMaterial Enargite = new DustMaterial(362, "enargite", 0xBBBBBB, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Copper, 3), new MaterialStack(Arsenic, 1), new MaterialStack(Sulfur, 4)), GENERATE_ORE);
    public static DustMaterial Tennantite = new DustMaterial(363, "tennantite", 0x909090, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Copper, 12), new MaterialStack(Arsenic, 4), new MaterialStack(Sulfur, 13)), GENERATE_ORE);

    /**
     * Second Degree Compounds
     */
    public static GemMaterial Glass = new GemMaterial(209, "glass", 0xFFFFFF, MaterialIconSet.GLASS, 0, of(new MaterialStack(SiliconDioxide, 1)), GENERATE_PLATE | GENERATE_LENSE | NO_SMASHING | NO_RECYCLING | SMELT_INTO_FLUID | EXCLUDE_BLOCK_CRAFTING_RECIPES);
    public static DustMaterial Perlite = new DustMaterial(210, "perlite", 0x1E141E, MaterialIconSet.DULL, 1, of(new MaterialStack(Obsidian, 2), new MaterialStack(Water, 1)), 0);
    public static DustMaterial Borax = new DustMaterial(313, "borax", 0xFFFFFF, MaterialIconSet.SAND, 1, of(new MaterialStack(Sodium, 2), new MaterialStack(Boron, 4), new MaterialStack(Water, 10), new MaterialStack(Oxygen, 7)), 0);
    public static GemMaterial Lignite = new GemMaterial(211, "lignite", 0x644646, MaterialIconSet.LIGNITE, 0, of(new MaterialStack(Carbon, 2), new MaterialStack(Water, 4), new MaterialStack(DarkAsh, 1)), GENERATE_ORE | FLAMMABLE | NO_SMELTING | NO_SMASHING | MORTAR_GRINDABLE);
    public static GemMaterial Olivine = new GemMaterial(212, "olivine", 0x66FF66, MaterialIconSet.RUBY, 2, of(new MaterialStack(Magnesium, 2), new MaterialStack(Iron, 1), new MaterialStack(SiliconDioxide, 2)), STD_GEM | NO_SMASHING | NO_SMELTING | HIGH_SIFTER_OUTPUT, 7.0F, 256);
    public static GemMaterial Opal = new GemMaterial(213, "opal", 0x0000FF, MaterialIconSet.OPAL, 2, of(new MaterialStack(SiliconDioxide, 1)), STD_GEM | NO_SMASHING | NO_SMELTING | HIGH_SIFTER_OUTPUT, 7.0F, 256);
    public static GemMaterial Amethyst = new GemMaterial(214, "amethyst", 0xD232D2, MaterialIconSet.RUBY, 3, of(new MaterialStack(SiliconDioxide, 4), new MaterialStack(Iron, 1)), STD_GEM | NO_SMASHING | NO_SMELTING | HIGH_SIFTER_OUTPUT, 7.0F, 256);
    public static DustMaterial Redstone = new DustMaterial(215, "redstone", 0xC80000, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Silicon, 1), new MaterialStack(Pyrite, 5), new MaterialStack(Ruby, 1), new MaterialStack(Mercury, 3)), GENERATE_PLATE | GENERATE_ORE | NO_SMASHING | SMELT_INTO_FLUID);
    public static GemMaterial Lapis = new GemMaterial(216, "lapis", 0x4646DC, MaterialIconSet.LAPIS, 1, of(new MaterialStack(Lazurite, 12), new MaterialStack(Sodalite, 2), new MaterialStack(Pyrite, 1), new MaterialStack(Calcite, 1)), STD_GEM | NO_SMASHING | NO_SMELTING | CRYSTALLISABLE | NO_WORKING | DECOMPOSITION_BY_ELECTROLYZING);
    public static DustMaterial Blaze = new DustMaterial(217, "blaze", 0xFFC800, MaterialIconSet.DULL, 1, of(new MaterialStack(DarkAsh, 1), new MaterialStack(Sulfur, 1)), NO_SMELTING | SMELT_INTO_FLUID | MORTAR_GRINDABLE | BURNING);
    public static GemMaterial EnderPearl = new GemMaterial(218, "ender_pearl", 0x6CDCC8, MaterialIconSet.GEM_VERTICAL, 1, of(new MaterialStack(Beryllium, 1), new MaterialStack(Potassium, 4), new MaterialStack(Nitrogen, 5)), GENERATE_PLATE | GENERATE_LENSE | NO_SMASHING | NO_SMELTING);
    public static GemMaterial EnderEye = new GemMaterial(219, "ender_eye", 0x66FF66, MaterialIconSet.GEM_VERTICAL, 1, of(new MaterialStack(EnderPearl, 1), new MaterialStack(Blaze, 1)), GENERATE_PLATE | GENERATE_LENSE | NO_SMASHING | NO_SMELTING);
    public static RoughSolidMaterial Flint = new RoughSolidMaterial(220, "flint", 0x002040, MaterialIconSet.FLINT, 1, of(new MaterialStack(SiliconDioxide, 1)), NO_SMASHING | MORTAR_GRINDABLE, () -> OrePrefix.gem);
    public static DustMaterial Diatomite = new DustMaterial(221, "diatomite", 0xE1E1E1, MaterialIconSet.DULL, 1, of(new MaterialStack(Flint, 8), new MaterialStack(BandedIron, 1), new MaterialStack(Sapphire, 1)), 0);
    public static DustMaterial VolcanicAsh = new DustMaterial(222, "volcanic_ash", 0x3C3232, MaterialIconSet.SAND, 0, of(new MaterialStack(Flint, 6), new MaterialStack(Iron, 1), new MaterialStack(Magnesium, 1)), 0);
    public static DustMaterial Niter = new DustMaterial(223, "niter", 0xFFC8C8, MaterialIconSet.FLINT, 1, of(new MaterialStack(Saltpeter, 1)), NO_SMASHING | NO_SMELTING);
    public static DustMaterial Tantalite = new DustMaterial(224, "tantalite", 0x915028, MaterialIconSet.METALLIC, 3, of(new MaterialStack(Manganese, 1), new MaterialStack(Tantalum, 2), new MaterialStack(Oxygen, 6)), GENERATE_ORE);
    public static DustMaterial HydratedCoal = new DustMaterial(225, "hydrated_coal", 0x464664, MaterialIconSet.ROUGH, 1, of(new MaterialStack(Coal, 8), new MaterialStack(Water, 1)), 0);
    public static GemMaterial Apatite = new GemMaterial(226, "apatite", 0xC8C8FF, MaterialIconSet.EMERALD, 1, of(new MaterialStack(Calcium, 5), new MaterialStack(Phosphate, 3), new MaterialStack(Chlorine, 1)), GENERATE_ORE | NO_SMASHING | NO_SMELTING | CRYSTALLISABLE);
    public static IngotMaterial SterlingSilver = new IngotMaterial(227, "sterling_silver", 0xFADCE1, MaterialIconSet.SHINY, 2, of(new MaterialStack(Copper, 1), new MaterialStack(Silver, 4)), EXT2_METAL, null, 13.0F, 128, 1700);
    public static IngotMaterial RoseGold = new IngotMaterial(228, "rose_gold", 0xFFE61E, MaterialIconSet.SHINY, 2, of(new MaterialStack(Copper, 1), new MaterialStack(Gold, 4)), EXT2_METAL, null, 14.0F, 128, 1600);
    public static IngotMaterial BlackBronze = new IngotMaterial(229, "black_bronze", 0x64327D, MaterialIconSet.DULL, 2, of(new MaterialStack(Gold, 1), new MaterialStack(Silver, 1), new MaterialStack(Copper, 3)), EXT2_METAL, null, 12.0F, 256, 2000);
    public static IngotMaterial BismuthBronze = new IngotMaterial(230, "bismuth_bronze", 0x647D7D, MaterialIconSet.DULL, 2, of(new MaterialStack(Bismuth, 1), new MaterialStack(Zinc, 1), new MaterialStack(Copper, 3)), EXT2_METAL, null, 8.0F, 256, 1100);
    public static IngotMaterial BlackSteel = new IngotMaterial(231, "black_steel", 0x646464, MaterialIconSet.DULL, 2, of(new MaterialStack(Nickel, 1), new MaterialStack(BlackBronze, 1), new MaterialStack(Steel, 3)), EXT_METAL, null, 6.5F, 768, 1200);
    public static IngotMaterial RedSteel = new IngotMaterial(232, "red_steel", 0x8C6464, MaterialIconSet.DULL, 2, of(new MaterialStack(SterlingSilver, 1), new MaterialStack(BismuthBronze, 1), new MaterialStack(Steel, 2), new MaterialStack(BlackSteel, 4)), EXT_METAL, null, 7.0F, 896, 1300);
    public static IngotMaterial BlueSteel = new IngotMaterial(233, "blue_steel", 0x64648C, MaterialIconSet.DULL, 2, of(new MaterialStack(RoseGold, 1), new MaterialStack(Brass, 1), new MaterialStack(Steel, 2), new MaterialStack(BlackSteel, 4)), EXT_METAL | GENERATE_FRAME, null, 7.5F, 1024, 1400);
    public static IngotMaterial DamascusSteel = new IngotMaterial(234, "damascus_steel", 0x6E6E6E, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Steel, 1)), EXT_METAL, null, 8.0F, 1280, 1500);
    public static IngotMaterial TungstenSteel = new IngotMaterial(235, "tungsten_steel", 0x6464A0, MaterialIconSet.METALLIC, 4, of(new MaterialStack(Steel, 1), new MaterialStack(Tungsten, 1)), EXT2_METAL | GENERATE_RING | GENERATE_ROTOR | GENERATE_SMALL_GEAR | GENERATE_LONG_ROD | GENERATE_DENSE | GENERATE_FRAME, null, 8.0F, 2560, 3000);
    public static FluidMaterial NitroFuel = new FluidMaterial(236, "nitro_fuel", 0xC8FF00, MaterialIconSet.FLUID, of(new MaterialStack(Glyceryl, 1), new MaterialStack(Fuel, 4)), FLAMMABLE | EXPLOSIVE | NO_SMELTING | NO_SMASHING);
    public static IngotMaterial RedAlloy = new IngotMaterial(237, "red_alloy", 0xC80000, MaterialIconSet.DULL, 0, of(new MaterialStack(Copper, 1), new MaterialStack(Redstone, 4)), GENERATE_PLATE | GENERATE_FINE_WIRE);
    public static IngotMaterial CobaltBrass = new IngotMaterial(238, "cobalt_brass", 0xB4B4A0, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Brass, 7), new MaterialStack(Aluminium, 1), new MaterialStack(Cobalt, 1)), EXT2_METAL, null, 8.0F, 256);
    public static DustMaterial Phosphor = new DustMaterial(239, "phosphor", 0xFFFF00, MaterialIconSet.FLINT, 2, of(new MaterialStack(Calcium, 3), new MaterialStack(Phosphate, 2)), GENERATE_ORE | NO_SMASHING | NO_SMELTING | FLAMMABLE | EXPLOSIVE);
    public static DustMaterial Basalt = new DustMaterial(240, "basalt", 0x1E1414, MaterialIconSet.ROUGH, 1, of(new MaterialStack(Olivine, 1), new MaterialStack(Calcite, 3), new MaterialStack(Flint, 8), new MaterialStack(DarkAsh, 4)), NO_SMASHING);
    public static DustMaterial Andesite = new DustMaterial(241, "andesite", 0xBEBEBE, MaterialIconSet.ROUGH, 2, of(), NO_SMASHING);
    public static DustMaterial Diorite = new DustMaterial(242, "diorite", 0xFFFFFF, MaterialIconSet.ROUGH, 2, of(), NO_SMASHING);
    public static GemMaterial GarnetRed = new GemMaterial(243, "garnet_red", 0xC85050, MaterialIconSet.RUBY, 2, of(new MaterialStack(Pyrope, 3), new MaterialStack(Almandine, 5), new MaterialStack(Spessartine, 8)), STD_SOLID | GENERATE_LENSE | NO_SMASHING | NO_SMELTING | HIGH_SIFTER_OUTPUT | GENERATE_ORE, null, 7.0F, 128);
    public static GemMaterial GarnetYellow = new GemMaterial(244, "garnet_yellow", 0xC8C850, MaterialIconSet.RUBY, 2, of(new MaterialStack(Andradite, 5), new MaterialStack(Grossular, 8), new MaterialStack(Uvarovite, 3)), STD_SOLID | GENERATE_LENSE | NO_SMASHING | NO_SMELTING | HIGH_SIFTER_OUTPUT | GENERATE_ORE, null, 7.0F, 128);
    public static DustMaterial Marble = new DustMaterial(245, "marble", 0xC8C8C8, MaterialIconSet.FINE, 1, of(new MaterialStack(Magnesium, 1), new MaterialStack(Calcite, 7)), NO_SMASHING);
    public static DustMaterial Sugar = new DustMaterial(246, "sugar", 0xFAFAFA, MaterialIconSet.SAND, 1, of(new MaterialStack(Carbon, 2), new MaterialStack(Water, 5), new MaterialStack(Oxygen, 25)), 0);
    public static GemMaterial Vinteum = new GemMaterial(247, "vinteum", 0x64C8FF, MaterialIconSet.EMERALD, 3, of(), STD_GEM | NO_SMASHING | NO_SMELTING, 10.0F, 128);
    public static DustMaterial Redrock = new DustMaterial(248, "redrock", 0xFF5032, MaterialIconSet.ROUGH, 1, of(new MaterialStack(Calcite, 2), new MaterialStack(Flint, 1), new MaterialStack(Clay, 1)), NO_SMASHING);
    public static DustMaterial PotassiumFeldspar = new DustMaterial(249, "potassium_feldspar", 0x782828, MaterialIconSet.FINE, 1, of(new MaterialStack(Potassium, 1), new MaterialStack(Aluminium, 1), new MaterialStack(Silicon, 3), new MaterialStack(Oxygen, 8)), 0);
    public static DustMaterial Biotite = new DustMaterial(250, "biotite", 0x141E14, MaterialIconSet.METALLIC, 1, of(new MaterialStack(Potassium, 1), new MaterialStack(Magnesium, 3), new MaterialStack(Aluminium, 3), new MaterialStack(Fluorine, 2), new MaterialStack(Silicon, 3), new MaterialStack(Oxygen, 10)), 0);
    public static DustMaterial GraniteBlack = new DustMaterial(251, "granite_black", 0x0A0A0A, MaterialIconSet.ROUGH, 3, of(new MaterialStack(SiliconDioxide, 4), new MaterialStack(Biotite, 1)), NO_SMASHING);
    public static DustMaterial GraniteRed = new DustMaterial(252, "granite_red", 0xFF0080, MaterialIconSet.ROUGH, 3, of(new MaterialStack(Aluminium, 2), new MaterialStack(PotassiumFeldspar, 1), new MaterialStack(Oxygen, 3)), NO_SMASHING);
    public static DustMaterial Chrysotile = new DustMaterial(253, "chrysotile", 0x6E8C6E, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Asbestos, 1)), 0);
    public static DustMaterial Realgar = new DustMaterial(254, "realgar", 0x8C6464, MaterialIconSet.DULL, 2, of(new MaterialStack(Arsenic, 4), new MaterialStack(Sulfur, 4)), 0);
    public static DustMaterial VanadiumMagnetite = new DustMaterial(255, "vanadium_magnetite", 0x23233C, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Magnetite, 1), new MaterialStack(Vanadium, 1)), GENERATE_ORE);
    public static DustMaterial BasalticMineralSand = new DustMaterial(266, "basaltic_mineral_sand", 0x283228, MaterialIconSet.SAND, 1, of(new MaterialStack(Magnetite, 1), new MaterialStack(Basalt, 1)), INDUCTION_SMELTING_LOW_OUTPUT);
    public static DustMaterial GraniticMineralSand = new DustMaterial(267, "granitic_mineral_sand", 0x283C3C, MaterialIconSet.SAND, 1, of(new MaterialStack(Magnetite, 1), new MaterialStack(GraniteBlack, 1)), INDUCTION_SMELTING_LOW_OUTPUT);
    public static DustMaterial GarnetSand = new DustMaterial(268, "garnet_sand", 0xC86400, MaterialIconSet.SAND, 1, of(new MaterialStack(GarnetRed, 1), new MaterialStack(GarnetYellow, 1)), 0);
    public static DustMaterial QuartzSand = new DustMaterial(269, "quartz_sand", 0xC8C8C8, MaterialIconSet.SAND, 1, of(new MaterialStack(CertusQuartz, 1), new MaterialStack(Quartzite, 1)), 0);
    public static DustMaterial Bastnasite = new DustMaterial(270, "bastnasite", 0xC86E2D, MaterialIconSet.FINE, 2, of(new MaterialStack(Cerium, 1), new MaterialStack(Carbon, 1), new MaterialStack(Fluorine, 1), new MaterialStack(Oxygen, 3)), GENERATE_ORE);
    public static DustMaterial Pentlandite = new DustMaterial(271, "pentlandite", 0xA59605, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Nickel, 9), new MaterialStack(Sulfur, 8)), GENERATE_ORE | INDUCTION_SMELTING_LOW_OUTPUT);
    public static DustMaterial Spodumene = new DustMaterial(272, "spodumene", 0xBEAAAA, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Lithium, 1), new MaterialStack(Aluminium, 1), new MaterialStack(Silicon, 2), new MaterialStack(Oxygen, 6)), GENERATE_ORE);
    public static DustMaterial Pollucite = new DustMaterial(273, "pollucite", 0xF0D2D2, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Caesium, 2), new MaterialStack(Aluminium, 2), new MaterialStack(Silicon, 4), new MaterialStack(Water, 2), new MaterialStack(Oxygen, 12)), 0);
    public static DustMaterial Lepidolite = new DustMaterial(274, "lepidolite", 0xF0328C, MaterialIconSet.FINE, 2, of(new MaterialStack(Potassium, 1), new MaterialStack(Lithium, 3), new MaterialStack(Aluminium, 4), new MaterialStack(Fluorine, 2), new MaterialStack(Oxygen, 10)), GENERATE_ORE);
    public static DustMaterial Glauconite = new DustMaterial(275, "glauconite", 0x82B43C, MaterialIconSet.DULL, 2, of(new MaterialStack(Potassium, 1), new MaterialStack(Magnesium, 2), new MaterialStack(Aluminium, 4), new MaterialStack(Hydrogen, 2), new MaterialStack(Oxygen, 12)), GENERATE_ORE);
    public static DustMaterial GlauconiteSand = new DustMaterial(276, "glauconite_sand", 0x82B43C, MaterialIconSet.SAND, 2, of(new MaterialStack(Potassium, 1), new MaterialStack(Magnesium, 2), new MaterialStack(Aluminium, 4), new MaterialStack(Hydrogen, 2), new MaterialStack(Oxygen, 12)), 0);
    public static DustMaterial Vermiculite = new DustMaterial(277, "vermiculite", 0xC8B40F, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Iron, 3), new MaterialStack(Aluminium, 4), new MaterialStack(Silicon, 4), new MaterialStack(Hydrogen, 2), new MaterialStack(Water, 4), new MaterialStack(Oxygen, 12)), 0);
    public static DustMaterial Bentonite = new DustMaterial(278, "bentonite", 0xF5D7D2, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Sodium, 1), new MaterialStack(Magnesium, 6), new MaterialStack(Silicon, 12), new MaterialStack(Hydrogen, 4), new MaterialStack(Water, 5), new MaterialStack(Oxygen, 36)), GENERATE_ORE);
    public static DustMaterial FullersEarth = new DustMaterial(279, "fullers_earth", 0xA0A078, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Magnesium, 1), new MaterialStack(Silicon, 4), new MaterialStack(Hydrogen, 1), new MaterialStack(Water, 4), new MaterialStack(Oxygen, 11)), 0);
    public static DustMaterial Pitchblende = new DustMaterial(280, "pitchblende", 0xC8D200, MaterialIconSet.ROUGH, 3, of(new MaterialStack(Uraninite, 3), new MaterialStack(Thorium, 1), new MaterialStack(Lead, 1)), GENERATE_ORE);
    public static GemMaterial Monazite = new GemMaterial(281, "monazite", 0x324632, MaterialIconSet.GEM_VERTICAL, 1, of(new MaterialStack(RareEarth, 1), new MaterialStack(Phosphate, 1)), GENERATE_ORE | NO_SMASHING | NO_SMELTING | CRYSTALLISABLE);
    public static DustMaterial Malachite = new DustMaterial(282, "malachite", 0x055F05, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Copper, 2), new MaterialStack(Carbon, 1), new MaterialStack(Hydrogen, 2), new MaterialStack(Oxygen, 5)), GENERATE_ORE | INDUCTION_SMELTING_LOW_OUTPUT);
    public static DustMaterial Mirabilite = new DustMaterial(283, "mirabilite", 0xF0FAD2, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Sodium, 2), new MaterialStack(Sulfur, 1), new MaterialStack(Water, 10), new MaterialStack(Oxygen, 4)), 0);
    public static DustMaterial Mica = new DustMaterial(284, "mica", 0xC3C3CD, MaterialIconSet.FINE, 1, of(new MaterialStack(Potassium, 1), new MaterialStack(Aluminium, 3), new MaterialStack(Silicon, 3), new MaterialStack(Fluorine, 2), new MaterialStack(Oxygen, 10)), 0);
    public static DustMaterial Trona = new DustMaterial(285, "trona", 0x87875F, MaterialIconSet.ROUGH, 1, of(new MaterialStack(Sodium, 3), new MaterialStack(Carbon, 2), new MaterialStack(Hydrogen, 1), new MaterialStack(Water, 2), new MaterialStack(Oxygen, 6)), 0);
    public static DustMaterial Barite = new DustMaterial(286, "barite", 0xE6EBFF, MaterialIconSet.DULL, 2, of(new MaterialStack(Barium, 1), new MaterialStack(Sulfur, 1), new MaterialStack(Oxygen, 4)), GENERATE_ORE);
    public static DustMaterial Gypsum = new DustMaterial(287, "gypsum", 0xE6E6FA, MaterialIconSet.FINE, 1, of(new MaterialStack(Calcium, 1), new MaterialStack(Sulfur, 1), new MaterialStack(Water, 2), new MaterialStack(Oxygen, 4)), 0);
    public static DustMaterial Alunite = new DustMaterial(288, "alunite", 0xE1B441, MaterialIconSet.METALLIC, 2, of(new MaterialStack(Potassium, 1), new MaterialStack(Aluminium, 3), new MaterialStack(Silicon, 2), new MaterialStack(Hydrogen, 6), new MaterialStack(Oxygen, 14)), 0);
    public static DustMaterial Dolomite = new DustMaterial(289, "dolomite", 0xE1CDCD, MaterialIconSet.FLINT, 1, of(new MaterialStack(Calcium, 1), new MaterialStack(Magnesium, 1), new MaterialStack(Carbon, 2), new MaterialStack(Oxygen, 6)), 0);
    public static DustMaterial Wollastonite = new DustMaterial(290, "wollastonite", 0xF0F0F0, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Calcium, 1), new MaterialStack(Silicon, 1), new MaterialStack(Oxygen, 3)), 0);
    public static DustMaterial Zeolite = new DustMaterial(291, "zeolite", 0xF0E6E6, MaterialIconSet.ROUGH, 2, of(new MaterialStack(Sodium, 1), new MaterialStack(Calcium, 4), new MaterialStack(Silicon, 27), new MaterialStack(Aluminium, 9), new MaterialStack(Water, 28), new MaterialStack(Oxygen, 72)), 0);
    public static DustMaterial Kyanite = new DustMaterial(292, "kyanite", 0x6E6EFA, MaterialIconSet.FLINT, 2, of(new MaterialStack(Aluminium, 2), new MaterialStack(Silicon, 1), new MaterialStack(Oxygen, 5)), 0);
    public static DustMaterial Kaolinite = new DustMaterial(293, "kaolinite", 0xF5EBEB, MaterialIconSet.DULL, 2, of(new MaterialStack(Aluminium, 2), new MaterialStack(Silicon, 2), new MaterialStack(Hydrogen, 4), new MaterialStack(Oxygen, 9)), 0);
    public static DustMaterial Talc = new DustMaterial(294, "talc", 0x5AB45A, MaterialIconSet.FINE, 2, of(new MaterialStack(Magnesium, 3), new MaterialStack(Silicon, 4), new MaterialStack(Hydrogen, 2), new MaterialStack(Oxygen, 12)), GENERATE_ORE);
    public static DustMaterial Soapstone = new DustMaterial(295, "soapstone", 0x5F915F, MaterialIconSet.ROUGH, 1, of(new MaterialStack(Magnesium, 3), new MaterialStack(Silicon, 4), new MaterialStack(Hydrogen, 2), new MaterialStack(Oxygen, 12)), GENERATE_ORE);
    public static DustMaterial Concrete = new DustMaterial(296, "concrete", 0x646464, MaterialIconSet.ROUGH, 1, of(new MaterialStack(Stone, 1)), NO_SMASHING | SMELT_INTO_FLUID);
    public static IngotMaterial IronMagnetic = new IngotMaterial(297, "iron_magnetic", 0xC8C8C8, MaterialIconSet.MAGNETIC, 2, of(new MaterialStack(Iron, 1)), EXT2_METAL | MORTAR_GRINDABLE, null, 6.0F, 256);
    public static IngotMaterial SteelMagnetic = new IngotMaterial(298, "steel_magnetic", 0x808080, MaterialIconSet.MAGNETIC, 2, of(new MaterialStack(Steel, 1)), EXT2_METAL | GENERATE_RING | GENERATE_ROTOR | GENERATE_SMALL_GEAR | MORTAR_GRINDABLE, null, 6.0F, 512, 1000);
    public static IngotMaterial NeodymiumMagnetic = new IngotMaterial(299, "neodymium_magnetic", 0x646464, MaterialIconSet.MAGNETIC, 2, of(new MaterialStack(Neodymium, 1)), EXT2_METAL | GENERATE_LONG_ROD, null, 7.0F, 512, 1297);
    public static IngotMaterial TungstenCarbide = new IngotMaterial(300, "tungsten_carbide", 0x330066, MaterialIconSet.METALLIC, 4, of(new MaterialStack(Tungsten, 1), new MaterialStack(Carbon, 1)), EXT2_METAL, null, 14.0F, 1280, 2460);
    public static IngotMaterial VanadiumSteel = new IngotMaterial(301, "vanadium_steel", 0xC0C0C0, MaterialIconSet.METALLIC, 3, of(new MaterialStack(Vanadium, 1), new MaterialStack(Chrome, 1), new MaterialStack(Steel, 7)), EXT2_METAL, null, 3.0F, 1920, 1453);
    public static IngotMaterial HSSG = new IngotMaterial(302, "hssg", 0x999900, MaterialIconSet.METALLIC, 3, of(new MaterialStack(TungstenSteel, 5), new MaterialStack(Chrome, 1), new MaterialStack(Molybdenum, 2), new MaterialStack(Vanadium, 1)), EXT2_METAL | GENERATE_RING | GENERATE_ROTOR | GENERATE_SMALL_GEAR | GENERATE_LONG_ROD | GENERATE_FRAME, null, 10.0F, 4000, 4500);
    public static IngotMaterial HSSE = new IngotMaterial(303, "hsse", 0x336600, MaterialIconSet.METALLIC, 4, of(new MaterialStack(HSSG, 6), new MaterialStack(Cobalt, 1), new MaterialStack(Manganese, 1), new MaterialStack(Silicon, 1)), EXT2_METAL | GENERATE_RING | GENERATE_ROTOR | GENERATE_SMALL_GEAR | GENERATE_LONG_ROD | GENERATE_FRAME, null, 10.0F, 5120, 5400);
    public static IngotMaterial HSSS = new IngotMaterial(304, "hsss", 0x660033, MaterialIconSet.METALLIC, 4, of(new MaterialStack(HSSG, 6), new MaterialStack(Iridium, 2), new MaterialStack(Osmium, 1)), EXT2_METAL | GENERATE_GEAR, null, 14.0F, 3000, 5400);
    /**
     * Clear matter materials
     */
    public static FluidMaterial UUAmplifier = new FluidMaterial(305, "uuamplifier", 0xAA00AA, MaterialIconSet.FLUID, of(), 0);
    public static FluidMaterial UUMatter = new FluidMaterial(306, "uumatter", 0x770077, MaterialIconSet.FLUID, of(), 0);

    /**
     * Stargate materials
     */
    public static IngotMaterial Naquadah = new IngotMaterial(307, "naquadah", 0x323232, MaterialIconSet.METALLIC, 4, of(), EXT_METAL | GENERATE_ORE, Element.Nq, 6.0F, 1280, 5400);
    public static IngotMaterial NaquadahAlloy = new IngotMaterial(308, "naquadah_alloy", 0x282828, MaterialIconSet.METALLIC, 5, of(new MaterialStack(Naquadah, 1), new MaterialStack(Osmiridium, 1)), EXT2_METAL, null, 8.0F, 5120, 7200);
    public static IngotMaterial NaquadahEnriched = new IngotMaterial(309, "naquadah_enriched", 0x282828, MaterialIconSet.METALLIC, 4, of(), EXT_METAL | GENERATE_ORE, null, 6.0F, 1280, 4500);
    public static IngotMaterial Naquadria = new IngotMaterial(310, "naquadria", 0x1E1E1E, MaterialIconSet.SHINY, 3, of(), EXT_METAL, Element.Nq, 9000);
    public static IngotMaterial Tritanium = new IngotMaterial(311, "tritanium", 0xFFFFFF, MaterialIconSet.METALLIC, 6, of(), EXT_METAL, Element.Tr, 20.0F, 10240);
    public static IngotMaterial Duranium = new IngotMaterial(312, "duranium", 0xFFFFFF, MaterialIconSet.METALLIC, 5, of(), EXT_METAL, Element.Dr, 16.0F, 5120);

    /**
     * Actual food
     */
    public static FluidMaterial Milk = new FluidMaterial(339, "milk", 0xFEFEFE, MaterialIconSet.FINE, of(), 0);
    public static FluidMaterial Honey = new FluidMaterial(341, "honey", 0xD2C800, MaterialIconSet.FLUID, of(), 0);
    public static DustMaterial Cocoa = new DustMaterial(343, "cocoa", 0xBE5F00, MaterialIconSet.ROUGH, 0, of(), 0);
    public static DustMaterial Wheat = new DustMaterial(345, "wheat", 0xFFFFC4, MaterialIconSet.FINE, 0, of(), 0);
]]

doThing(str)