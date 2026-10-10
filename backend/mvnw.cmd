@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script
@REM ----------------------------------------------------------------------------

@IF "%DEBUG%" == "" @ECHO OFF
@SETLOCAL EnableExtensions EnableDelayedExpansion

SET "DIRNAME=%~dp0"
IF "%DIRNAME%" == "" SET "DIRNAME=."
SET "APP_BASE_NAME=%~n0"
SET "APP_HOME=%DIRNAME%"
@REM Project directory without the trailing backslash (a "\" before a closing quote would escape it)
SET "MAVEN_PROJECTBASEDIR=%DIRNAME:~0,-1%"

@REM Resolve Java
IF NOT "%JAVA_HOME%" == "" (
    SET "JAVACMD=%JAVA_HOME%\bin\java.exe"
) ELSE (
    SET "JAVACMD=java.exe"
)

SET "WRAPPER_JAR=%APP_HOME%\.mvn\wrapper\maven-wrapper.jar"
SET "WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain"

IF EXIST "%WRAPPER_JAR%" (
    "%JAVACMD%" -classpath "%WRAPPER_JAR%" "-Dmaven.home=%APP_HOME%\.mvn\wrapper" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" %WRAPPER_LAUNCHER% %*
    EXIT /B %ERRORLEVEL%
)

@REM Fallback to installed Maven if present
IF EXIST "%USERPROFILE%\apache-maven-3.9.9\bin\mvn.cmd" (
    CALL "%USERPROFILE%\apache-maven-3.9.9\bin\mvn.cmd" %*
    EXIT /B %ERRORLEVEL%
)

ECHO Error: Could not find maven-wrapper.jar or Maven installation.
EXIT /B 1
