import {Property} from "csstype";
import {useCallback, useRef, useState} from "react";
import usePhpContext from "../hooks/usePhpContext";

function SymfonyConsole() {
//{executePhpExpression, runSymfonyCommand}: {executePhpExpression: (expression: string) => any, runSymfonyCommand: (command: string) => string}
  const containerStyle = {
    background: 'black',
    width: '100%',
    height: '100%',
    borderRadius: '4px',
    padding: '12px 0 0 0',
    marginTop: '-20px',
    fontFamily: '"Roboto Mono", monospace',
    // opacity: '0',
    animation:'slideDownAnimation 1s ease-in-out 1s forwards, fadeInAnimation 0.8s ease-in-out 1s forwards',
  }

  const resultsStyle = {
    width: '100%',
    height: '65%',
    padding: '12px',
    overflowY: "auto" as Property.OverflowY,
    resize: 'none' as Property.Resize,
    border: 'none',
    fontSize: '14px',
    lineHeight: '28px',
    display: 'block',
    color: 'rgba(255,255,255,0.9)',
  }

  const formStyle = {
    padding: '18px',
  }
  const inputStyle = {
    background: 'black',
    display: 'block',
    border: 'none',
    borderTop: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '0 0 1vh 1vh',
    width: '100%',
    color: 'white',
    fontSize: '2vh',
    outline: 'none',
    fontFamily: '"Roboto Mono", monospace'
  }

  const outputLineStyle = {
    color: 'rgba(255,255,255,0.5)',
    margin: '0',
    padding: '0',
    display: 'inline-block',
    whiteSpace: "pre" as Property.WhiteSpace,
  }

  const [consoleOutput, mutateConsoleOutput] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const appendOutput = useCallback((output: string[]) => {
    mutateConsoleOutput((prev) => [...prev, ...output])
    setTimeout(() => resultRef.current?.scrollTo(0, resultRef.current.scrollHeight), 100)
  }, [resultRef])

  const resetOutput = () => mutateConsoleOutput([])

  const {executeCode} = usePhpContext();

  const executeExpression = useCallback((expression: string): string => {
    const code = `
      global $_SERVER;
      $_SERVER['PHP_SELF'] = 'bin/console';

      require '/src/api-platform/vendor/autoload.php';

      return ${expression};`;

    return executeCode(code) ?? ''
  }, [executeCode])

  const runSymfonyCommand = useCallback((command: string): string => {
    const code = `
      global $_SERVER;
      $_SERVER['PHP_SELF'] = 'bin/console';

      require '/src/api-platform/vendor/autoload.php';
      (new \\Symfony\\Component\\Dotenv\\Dotenv())->bootEnv('/src/api-platform/.env');

      $appKernel = new \\App\\Kernel('dev', false);

      $consoleApplication = new \\Symfony\\Bundle\\FrameworkBundle\\Console\\Application($appKernel);
      $consoleApplication->setAutoExit(false);

      $input = new \\Symfony\\Component\\Console\\Input\\StringInput("${command.replace(/"/g, '\\"')}");
      $output = new \\Symfony\\Component\\Console\\Output\\BufferedOutput(\\Symfony\\Component\\Console\\Output\\OutputInterface::VERBOSITY_DEBUG);

      $consoleApplication->run($input, $output);

      return $output->fetch();`;
    return executeCode(code) ?? ''
  }, [executeCode])

  const runCommand = () => {
    if(!inputRef.current) return
    const command = inputRef.current.value

    if(command === 'clear'){
      resetOutput()
    } else if(command.substring(0, 1) === '!'){
      const expression = command.substring(1).trim();
      appendOutput([
        `> php -r echo ${expression};`,
        executeExpression(expression)
      ])
    } else {
      appendOutput([
        `> symfony console ${command}`,
        runSymfonyCommand(command)
      ])
    }

    inputRef.current.value = ''
  }

  return (
    <div style={containerStyle}>
      <div style={resultsStyle} ref={resultRef}>
        {consoleOutput.map((content: string, i:number) => <p key={i} style={outputLineStyle}>{content}</p>)}
      </div>
      <form style={formStyle} onSubmit={(e) => {
        e.preventDefault()
        runCommand()
        return false
      }}>
        <input
          ref={inputRef}
          style={inputStyle}
          type="text"
          placeholder="symfony console ..."
          autoComplete="off"
        />
      </form>
    </div>
  )
}

export default SymfonyConsole