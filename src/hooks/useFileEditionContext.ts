import {createContext, useContext} from "react";

export type FileEditionContextValue = {content: string, type: string, fullPath: string}

export const FileEditionContext = createContext<FileEditionContextValue|null>(null)

const useFileEditionContext = () => {
  const context = useContext(FileEditionContext)

  if (context === undefined) {
    throw new Error('useFileEditionContext must be used within a FileEditionProvider')
  }

  return context
}

export default useFileEditionContext