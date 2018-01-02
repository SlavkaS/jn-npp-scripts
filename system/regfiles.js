/***************************************************************************
 * �� ������ ���� ��� ������� regwscs.js �� ������������ ������� SHPCE 
 * ��� Far (http://scrhostplugin.sf.net), � ���������� �������� -- a13x
 **************************************************************************/

/*
 *	������������ ��� ��������� ����������, ������������ ��������� ��� ���������.
 *
 *	�������������.
 *
 *		��������� ������ � �����, � ������� ����������� ��������� �a���.
 *
 *		��������� ������ ��� ������� ����������� ���� ��������� ������:
 *				
 *				cscript //nologo regfiles.js /I
 *
 *		��������� ������ ��� ������ ����������� ������:
 *	
 *				cscript //nologo regfiles.js /U
 *
 *		��������� ���������� ����� ��������� /S, � ���� ������ ������
 *		���������� � "�����" ������, �.�. �� ����� ������ �������� �� �������.
 *		��� ������ ��������� � ����������� � ���� regfiles.log ������� ������������
 *		�������������� �������� /L. ���� ��� ���� ������������ ����� �������� /S,
 *		�� ����� ��������� ����� ������������� *������* � ���� regfiles.log.
 * 
 *		����� ����� ��������������� ��������� ������� regall.bat � unregall.bat
 *		�������������� ��� ����������� � ������ ����������� ��������� ������.
 *		��� �� ������ ����������, ��� ��� ��� � ��������� ������ ������� ����������
 *		���� ���������.
 *
 *		�� ������� ��������� �� ������������:
 *					kuntashov at yandex dot ru
 *					kuntashov at gmail	dot com
 *		������� ��������� � ������ ���� (�����) ����� "OC_Install:" (��� �������).
 */

//*************************************************************************

// !!! ������� ���������� ���� ������ �����:
// ������� *.dll, ����� *.wsc. ������� ����� wsc-������ ���� �����,
// ��������� ���� ����� ����� ������������ ������.
// ��� �� ��������� Win9x/Me ���������� dynwrap.dll ������� �� �������� DynWin9x
// �������������� � �������� � ���������� �������.

var files = new Array(
//"SelectValue.dll",
"TLBINF32.DLL",
"svcsvc.dll"
// ,"dynwrap.dll",
// "WshExtra.dll",
// "macrosenum.dll",
// "SelectDialog.dll",
// "ArtWin.dll",
// "CommonServices.wsc",
// "Collections.wsc",
// "Registry.wsc",
// "1S.StatusIB.wsc",
// "SyntaxAnalysis.wsc",
// "ScriptingPlus.wsc",
// "OpenConf.RegistryIniFile.wsc"
);

//*************************************************************************

try {

	var WshShell = new ActiveXObject("WScript.Shell")
	var fso = new ActiveXObject("Scripting.FileSystemObject");

	// ������ ������ ������ � ����� ���������� ������ � �������, ������� ����������
	// ����������������, � �� ������, ���� �� ����� ����������� �� ������ �������
	// ����������, �� ������������� �������� �������� ������� ���������� �� ��,
	// � ������� ����� ��� ������
	WshShell.CurrentDirectory = fso.GetParentFolderName(WScript.ScriptFullName)

	var silent	= false;
	var unr		= false;
	var logfile	= null;

	// ���� ����������� �� ��� ����������� CScript.exe, �� �������������
	// ��������� ����� ��������� ������������, ���� �������� ��� �� ���������� 
	// MessageBox'�� ��� ������ ������ Echo() � ������ ����� ����������� �����
	// ��� ��������� � ��� (regfiles.log)

	var forseSilent = (/wscript.exe$/i).test(WScript.FullName);

	if (!WScript.Arguments.Count()) {
		WScript.Echo(usage());
		WScript.Quit(1);
	}

	unr	= WScript.Arguments.Named.Exists("U");

	if (WScript.Arguments.Named.Exists("L") || forseSilent) {
		logfile=fso.CreateTextFile("regfiles.log", true);
	}

	if (WScript.Arguments.Named.Exists("S")) {
		silent		= true;
		forseSilent = false;
	}

	if (!(unr||WScript.Arguments.Named.Exists("I"))) {
		WScript.Echo(usage());
		WScript.Quit(1);
	}

	var res = unr ? unregisterAll() : registerAll();

	var str = "";
	if (logfile) {
		logfile.Close();
		str = "\n����������� ����������� � ����� regfiles.log";
	}
	
	if (res) {
		if (!silent||forseSilent)
			WScript.Echo("����������� ��������� �������!" + str);
		WScript.Quit(0); // OK
	}

	if (!silent||forseSilent) 
		WScript.Echo("� �������� ����������� ���������� ������!" + str);
	WScript.Quit(1); // not OK

}
catch(e) {
	if (!silent||forseSilent)
		WScript.Echo("� �������� ����������� ���������� ������!\n"
					+ e.description);
	WScript.Quit(1); // not OK
}

//**************************************************************************

function usage() {
	return "Usage: cscript //nologo regfiles.js [/I|/U] [/S] [/L]\n"		 
		 + "  /I - register *.DLL and *.WSC files\n"
		 + "  /U - unregister *.DLL and *.WSC files\n"
		 + "  /S - keep silent (do not write any progress output to stdin)\n"
		 + "  /L - output messages to the regfiles.log\n";
}
function registerAll() {
	var isGood = false;
	if(testPreconditions())
    	isGood=runAll(files)
	return isGood;
}
function runAll(files, par){
    var isGood=true;
    for(var i in files) {
    	isGood=isGood&&runreg(i, files[i], par);
	}
    return isGood;
}
function unregisterAll(){
    return runAll(files.reverse(), "/U");
}
function runreg(i, file, par){
	if (file.toUpperCase()=="DYNWRAP.DLL") {
		if (par&&(par.toUpperCase()=="/U")) {
			// XXX �������� ����� �� ����� ��������� �������������� :-(, 
			// ���� ���������� ����� ���������
			msg("Skipped "+"["+(new Number(i)+1)+"/"+files.length+"]:"+cl);
			return true;
		}
        // ��� Win9x ����� ���� ������ dynwrap.dll
		if (runningUnderWin9x()) {
			file = "DynWin9x\\" + file;
		}
	}
    var fullPath=WshShell.CurrentDirectory+"\\"+file;
	var cl = (file.match(/\.dll$/)) ? regdll(fullPath, par) : regwsc(fullPath, par);
    msg("Running "+"["+(new Number(i)+1)+"/"+files.length+"]:"+cl);
    var errcode=WshShell.Run(cl,1,true);
	msg(((errcode==0)?"OK":"Failed")+" ( Error code = "+errcode+" )");
    return (errcode==0);
} //runreg
function regwsc(fullPath, params){
	return "regsvr32 /s "+(params?params+" ":"")+'scrobj.dll /n /i:"'+fullPath+'"';	
}
function regdll(fullPath, params){
	return "regsvr32 /s " + (params?params+" ":"") + '"' + fullPath + '"';    
}
function testPreconditions(){
	return testClass("MSScriptControl.ScriptControl", "Please install MS Script control"); 
} //testPreconditions
function testClass(progID, msg){
	try{
		new ActiveXObject(progID)
		return true;
	}catch(e){
		msg("Failed to create "+progID+". "+msg);
		return false;
	}
} //testClass
function msg(str){
	if (!silent) WScript.Echo(str);
	if (logfile) logfile.WriteLine(str);
}
function runningUnderWin9x() {
	return (WshShell.Environment.Item("OS") != "Windows_NT"); 
}