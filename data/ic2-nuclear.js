data.add("ic2 nuclear items","it2",[
	{name:"empty",						image:""},
	{name:"fuelRodUranium",				image:"ic2/reactorUraniumSimple.png"},
	{name:"dualFuelRodUranium",			image:"ic2/reactorUraniumDual.png"},
	{name:"quadFuelRodUranium",			image:"ic2/reactorUraniumQuad.png"},
	{name:"fuelRodMox",					image:"ic2/reactorMOXSimple.png"},
	{name:"dualFuelRodMox",				image:"ic2/reactorMOXDual.png"},
	{name:"quadFuelRodMox",				image:"ic2/reactorMOXQuad.png"},
	{name:"neutronReflector",			image:"ic2/reactorReflector.png"},
	{name:"thickNeutronReflector",		image:"ic2/reactorReflectorThick.png"},
	{name:"heatVent",					image:"ic2/reactorVent.png"},
	{name:"advancedHeatVent",			image:"ic2/reactorVentDiamond.png"},
	{name:"reactorHeatVent",			image:"ic2/reactorVentCore.png"},
	{name:"componentHeatVent",			image:"ic2/reactorVentSpread.png"},
	{name:"overclockedHeatVent",		image:"ic2/reactorVentGold.png"},
	{name:"coolantCell10k",				image:"ic2/reactorCoolantSimple.png"},
	{name:"coolantCell30k",				image:"ic2/reactorCoolantTriple.png"},
	{name:"coolantCell60k",				image:"ic2/reactorCoolantSix.png"},
	{name:"heatExchanger",				image:"ic2/reactorHeatSwitch.png"},
	{name:"advancedHeatExchanger",		image:"ic2/reactorHeatSwitchDiamond.png"},
	{name:"reactorHeatExchanger",		image:"ic2/reactorHeatSwitchCore.png"},
	{name:"componentHeatExchanger",		image:"ic2/reactorHeatSwitchSpread.png"},
	{name:"reactorPlating",				image:"ic2/reactorPlating.png"},
	{name:"heatCapacityReactorPlating",	image:"ic2/reactorPlatingHeat.png"},
	{name:"containmentReactorPlating",	image:"ic2/reactorPlatingExplosive.png"},
	{name:"rshCondensator",				image:"ic2/reactorCondensator.png"},
	{name:"lzhCondensator",				image:"ic2/reactorCondensatorLap.png"},
	{name:"fuelRodThorium",				image:"gregtech/gt.Thoriumcell.png"},
	{name:"dualFuelRodThorium",			image:"gregtech/gt.Double_Thoriumcell.png"},
	{name:"quadFuelRodThorium",			image:"gregtech/gt.Quad_Thoriumcell.png"},
	{name:"coolantCellHelium60k",		image:"gregtech/gt.60k_Helium_Coolantcell.png"},
	{name:"coolantCellHelium180k",		image:"gregtech/gt.180k_Helium_Coolantcell.png"},
	{name:"coolantCellHelium360k",		image:"gregtech/gt.360k_Helium_Coolantcell.png"},
	{name:"coolantCellNak60k",			image:"gregtech/gt.60k_NaK_Coolantcell.png"},
	{name:"coolantCellNak180k",			image:"gregtech/gt.180k_NaK_Coolantcell.png"},
	{name:"coolantCellNak360k",			image:"gregtech/gt.360k_NaK_Coolantcell.png"},
	{name:"iridiumNeutronReflector",	image:"gregtech/gt.neutronreflector.png"},
]);

var items = data.get("ic2 nuclear items","it2",);
var items_old = []
items_old[0] = "empty";
items_old[1] = "fuelRodUranium";
items_old[2] = "dualFuelRodUranium";
items_old[3] = "quadFuelRodUranium";
// item 4 empty
items_old[5] = "neutronReflector";
items_old[6] = "thickNeutronReflector";
items_old[7] = "heatVent";
items_old[8] = "reactorHeatVent";
items_old[9] = "overclockedHeatVent";
items_old[10] = "advancedHeatVent";
items_old[11] = "componentHeatVent";
items_old[12] = "rshCondensator";
items_old[13] = "lzhCondensator";
items_old[14] = "heatExchanger";
items_old[15] = "reactorHeatExchanger";
items_old[16] = "componentHeatExchanger";
items_old[17] = "advancedHeatExchanger";
items_old[18] = "reactorPlating";
items_old[19] = "heatCapacityReactorPlating";
items_old[20] = "containmentReactorPlating";
items_old[21] = "coolantCell10k";
items_old[22] = "coolantCell30k";
items_old[23] = "coolantCell60k";
// items 24-31 are empty
items_old[32] = "fuelRodThorium";
items_old[33] = "dualFuelRodThorium";
items_old[34] = "quadFuelRodThorium";
// items 35-37 are empty
items_old[38] = "iridiumNeutronReflector";
items_old[39] = "coolantCellHelium60k";
items_old[40] = "coolantCellHelium180k";
items_old[41] = "coolantCellHelium360k";
items_old[42] = "coolantCellNak60k";
items_old[43] = "coolantCellNak180k";
items_old[44] = "coolantCellNak360k";

var lookup = {};
for(var i=0;i<items.length;i++) {
	lookup[items[i].name] = i;
}
for(var i=0;i<45;i++) {
	if (items_old[i]) {
		items_old[i] = items[lookup[items_old[i]]];
	} else {
		items_old[i] = items[0];
	}
}

data.add("ic2 nuclear items old code","it2",items_old);