from rich.console import Console
from rich.table import Table
from rich.tree import Tree
from rich.columns import Columns
from rich.progress import (
    Progress,
    SpinnerColumn,
    BarColumn,
    TextColumn,
    TimeElapsedColumn,
    TimeRemainingColumn,
)
from rich.status import Status
from rich.markdown import Markdown
from rich.syntax import Syntax
from rich.traceback import install as install_traceback

# Enable rich tracebacks
install_traceback()


class Logger:
    def __init__(self):
        self.console = Console()

    def log(self, *args, **kwargs):
        """Log a message with rich formatting."""
        self.console.log(*args, **kwargs)

    def print(self, *args, **kwargs):
        """Print rich renderables or text."""
        self.console.print(*args, **kwargs)

    def table(self, title: str, columns: list[str], rows: list[list]):
        """Render a table given column names and row data."""
        table = Table(title=title)
        for col in columns:
            table.add_column(col)
        for row in rows:
            table.add_row(*[str(cell) for cell in row])
        self.console.print(table)

    def tree(self, label: str) -> Tree:
        """Create a tree with the given root label."""
        return Tree(label)

    def show_tree(self, tree: Tree):
        """Render a Tree object."""
        self.console.print(tree)

    def progress(self, **kwargs) -> Progress:
        """Create a Progress instance with default columns."""
        return Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TimeElapsedColumn(),
            TimeRemainingColumn(),
            console=self.console,
            **kwargs
        )

    def status(self, message: str) -> Status:
        """Create a Status context manager."""
        return Status(message, console=self.console)

    def columns(self, items: list[str]):
        """Render items in columns layout."""
        cols = Columns(items)
        self.console.print(cols)

    def markdown(self, text: str):
        """Render markdown text."""
        self.console.print(Markdown(text))

    def syntax(self, code: str, language: str = "python"):
        """Render code with syntax highlighting."""
        self.console.print(Syntax(code, language, theme="monokai", line_numbers=True))


# Singleton logger instance
logger = Logger()
