# Solids' SSR streams keeping me in suspense

Recently i had the privilege to experience the JS nation conference in beautiful city of Amsterdam, where cutting-edge tech enthusiasts gather to discuss the latest trends and innovations.

Conference, was a feast of knowledge and insights, and I had the privilege of attending a captivating talk that promised to demystify the intricate world of asynchronous consistency. Ryan Carniatos' talk titled "SolidJS: Why All the Suspense?" kept me in suspense.

Ryan began by delving into the challenges developers face while keeping data and the user interface (UI) synchronized in JavaScript frameworks. The crucial issue is inconsistency between UI and data in cases where async functionality comes in play.

In a simple example of a movie listing site with two tabs – New Releases and Favorites. The issue arises when the user switches tabs and briefly observes the content from the previous tab displayed on the new one. This phenomenon, known as "tearing," is a result of asynchronous inconsistency. Asynchronous actions, like fetching data, introduce complexities that can disrupt smooth UI transitions and erode user trust, forcing them to reload pages to ensure accurate information.

```tsx
function Movies() {
	const [movies, setMovies] = useState();
	const [category, setCategory] = useState("new Releases");

	useEffect(() => {
		fetchMovies(category).then((nextMovies) => {
			setMovies(nextMovies);
		})
	}, [category])

	return (
		<>
			<button onClick={() => setCategory("Favourites")}>Favourites</button>
			...
			<MovieList movies={movies} />
		</>
	);
}
```

We all wrote code like this. 

Generally we have three options to avoid inconsistent state caused by async data fetching.
1. show placeholder - loading spinners 🌀
2. stay in the past - show the old state until data are loaded
3. show the future - until the page gets the data we can only show parts we have
All these options use suspense to solve this problem.

> Suspense is a mechanism for creating boundaries in your view representation to ensure async consistency for users of your application.

Suspense goes beyond being a mere tool for displaying loading spinners; it's about creating a seamless user experience by synchronizing data fetching and UI rendering. Suspense boundaries provide control over state loading, minimizing jarring transitions and enhancing user satisfaction.
## SSR and suspense
One of the most fascinating aspects of Suspense, is its compatibility with Server-Side Rendering (SSR). Its not limited to just client-side rendering; Suspense can be leveraged effectively on the server as well.

From it emerges really cool way to handle partial renders by streaming server-side rendered HTML to client and progressively update the page. 

This is not a new concept(altho it was new to me). It was first introduces as async fragments in the Marco framework in 2013, powering Ebay.com.

We can achieve this, after we send the initial page skeleton to the user, by keeping the connection open and appending HTML to the bottom of the document. That HTML contains rendered components, script tags that move the HTML to the correct position and trigger hydration.   
### How it works
For our example we will use Solids' meta-framework [SolidStart](https://start.solidjs.com/getting-started/what-is-solidstart). Lets start a new project.

```
mkdir my-app && cd my-app  
npm init solid@latest  
```

We can choose from a list of templates.

```
? Which template do you want to use? › - Use arrow-keys. Return to submit.  
❯   bare      
	hackernews      
	with-auth      
	with-mdx      
	with-tailwindcss      
	with-vitest   
```

After we go through the steps, we end up with basic project structure.

```
node_modules/
public/
src/
├── routes/
│   ├── index.tsx
├── entry-client.tsx
├── entry-server.tsx
├── root.tsx
```

And working Solid js app.

![](https://setupcz.github.io/helloWorld.png)

### Enabling SSR stream
Solid makes it very simple for us to enable SSR streams. Just switch the `renderAsync` function for `renderStream` in the `entry-server.ts` file and we're good to go.

```tsx
export default createHandler(  
    renderStream((event) => <StartServer event={event} />)  
);
```

Nothing really changed tho. Thats because we don't load any data yet. Theres nothing to wait for. Nothing to suspend. Lets change that!
#### Fetching some data
Lets create an `api` folder, where we can store our fetch functions. 

```typescript
// api/index.ts

import {API_URL} from "~/api/constants";  
  
type Item = { name: string; }  
  
async function fetchData(waitMs: number): Promise<Item[]> {  
    const response = await fetch(API_URL);  
    const data = await response.json() as Item[];  
    
    return new Promise(  
        (resolve) => setTimeout(() => resolve(data), waitMs)  
    )  
}  
  
export async function fetchList(): Promise<Item[]> {  
    return fetchData(3000)  
}  
  
export async function fetchItem(): Promise<Item> {  
    const [item] = await fetchData(1000)  
    return item  
}
```

And update the index page. First we use `createResource` to fetch our list and item data. Then update the heading and add a `<For />` component to display out the list items.

```tsx
// routes/index.tsx

import {Title} from "solid-start";  
import Counter from "~/components/Counter";  
import {createResource, For, Suspense} from "solid-js";  
import {fetchItem, fetchList} from "~/api";  

export default function Home() {  
    const [list] = createResource(fetchList);  
    const [item] = createResource(fetchItem);  
      
    return (  
        <main>  
            <Title>Hello World</Title>  
            
            <h1>{item()?.name}</h1>  
            
			<For each={list()}>  
				{(student) => <li>{student.name}</li>}  
			</For>  
        </main>  
    );  
}
```
### Pause for suspense
Here comes the magic. Now we have all the ingredience to elevate our UI with suspense. To provide nice experience to our users. With suspense we can create visual boundaries to indicate a loading state to a user anywhere inside our application.

```tsx
// routes/index.tsx

...

<Suspense fallback={<div>loading a list...</div>}>
	<For each={list()}>  
		{(student) => <li>{student.name}</li>}  
	</For>  
</Suspense>

...

// root.tsx

...

<Suspense fallback={<div>loading...</div>}>  
    <Routes>  
        <FileRoutes/>  
    </Routes>  
</Suspense>

...
```

And the best thing is, it work on a server as well. Native SSR. 

In our example, we first wrap the whole file router with suspense in the root component. That way we get a nice loading message when theres a async code being awaited in any page. 
Then we do the same for the `<For />` component rendering our list. 
Because suspense looks for the nearest  `<Suspense />` where nearest read happens (in the `each={list()}`), we can nest suspense boundaries and create visual separations of loading states.

Thanks to the enabled SSR streams our app first renders header and footer and everything outside the suspense surrounding `<FileRoutes />`. 
Then it waits for the nearest suspense surrounding async read, which is the heading inside the Home page.

```tsx
<h1>{item()?.name}</h1>
```

![](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2Q1cDNxZTRzMDI5dXhpZ2tvejE2M3FwcDM5d2pqeWdqdXl3MmJ0ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ydZv7ki1PBQey5tObY/giphy.gif)

In the initial HTML response, you can see the loading placeholder between the header and the footer. But also there is a template element with some long id. Thats where the home page will be eventually placed.   

![](https://setupcz.github.io/htmlBody.png)

When the first set of data are fetched and rendered on the server, they are streamed to the client and appended to the end of the document. 
We get the next UI state in a template and a script responsible for moving the template to its place.

![](https://setupcz.github.io/htmlTemplateHeading.png)

After that we get another template including the list of names and data we need to hydrate it.

![](https://setupcz.github.io/htmlTemplateList.png)

The integration of Server-Side Rendering (SSR) with Suspense in web development is an exciting advancement. This combination allows for the progressive updating of web pages, providing a smoother and more engaging user experience. By strategically implementing suspense boundaries, developers can visually indicate loading states, enhancing overall application quality. 

In conclusion, my experience at the JS Nation conference in Amsterdam was truly enlightening. Ryan Carniatos' talk on "SolidJS: Why All the Suspense?" highlighted the challenges of asynchronous consistency in web development, introducing Suspense as a powerful tool for seamless user experiences. It's fascinating how Suspense can be utilized in Server-Side Rendering (SSR) to progressively update pages, and it left me eager to implement these techniques in my projects.